# =========================================================
# File: services/keyword_intelligence_service.py
# Purpose:
# Pure algorithmic keyword intelligence layer — no AI.
#
# Aggregates historical missing_keywords from scan_results by job category,
# weights by frequency × mean score_improvement, and returns top signals
# to inject into the optimizer prompt as grounded guidance.
#
# Architecture based on:
#   - NIH/PMC 2024: keyword frequency-driven prompt enhancement strategy
#   - ACL 2024 (Addlesee): explicit grounding instructions reduce LLM
#     hallucination by up to 28% vs. ungrounded context injection
#   - Temporal-Decay Shapley (arXiv 2025): exponential decay for time-series
#     data valuation — recent records weighted higher than stale ones
#   - TalentCLEF 2025: seniority is the largest confounding variable in
#     resume keyword analysis — junior and senior roles share category but
#     not keyword sets
#
# Fixes applied (2026-07-01):
#   - Cold start: SYNTHETIC_PRIORS injected when real data < MIN_SAMPLE_SIZE
#   - Data decay: exponential decay (λ=0.01, half-life ≈ 70 days), hard
#     cutoff at 180 days
#   - Seniority: extract_seniority_level() classifies JD into 4 tiers;
#     passed to log_scan_result for future segmented queries
#   - Gaming: PostgREST filter caps score_improvement at < 25 (implausible
#     gains excluded from training signal)
#   - Silent failures: injection status + signal count logged on every call
#
# This layer feeds signals INTO Claude — it never generates text itself.
# Claude handles all generation; this handles pattern recognition.
# =========================================================

import logging
import math
import re
from collections import Counter, defaultdict
from datetime import datetime, timezone

logger = logging.getLogger("ai_resume_studio.keyword_intelligence")

# =========================================================
# Config
# =========================================================

# Minimum qualifying scan_results records required before injecting signals.
# Below this threshold we inject SYNTHETIC_PRIORS instead.
MIN_SAMPLE_SIZE = 10

# Maximum keywords to inject. More than 10 risks prompt dilution.
MAX_KEYWORDS = 8

# Temporal decay — exponential: weight = e^(-λ * days_old)
# λ=0.01 → half-life ≈ 70 days; records older than MAX_RECORD_AGE_DAYS dropped.
DECAY_LAMBDA = 0.01
MAX_RECORD_AGE_DAYS = 180

# Gaming protection: exclude records with implausibly large score improvements.
# A genuine optimization rarely exceeds 20 points; >25 suggests adversarial input
# or a scorer anomaly — exclude from signal training data.
MAX_PLAUSIBLE_IMPROVEMENT = 25

# =========================================================
# Job role taxonomy
# Maps regex patterns → canonical category strings.
# Matched against job description text (case-insensitive, left-to-right).
# More specific patterns are listed first.
# =========================================================

ROLE_PATTERNS: list[tuple[str, str]] = [
    (r"product manager|product management|pm\b|head of product|product lead|product owner", "product_manager"),
    (r"software engineer|software developer|swe\b|backend engineer|frontend engineer|full.?stack", "software_engineer"),
    (r"data scientist|machine learning engineer|ml engineer|ai engineer|research scientist", "data_scientist"),
    (r"data analyst|business analyst|analytics engineer|business intelligence|bi analyst|bi developer", "data_analyst"),
    (r"marketing manager|digital marketing|brand manager|growth marketing|marketing director|demand generation", "marketing_manager"),
    (r"operations manager|operations coordinator|ops manager|operations lead|director of operations", "operations_manager"),
    (r"project manager|program manager|pmp\b|scrum master|delivery manager", "project_manager"),
    (r"ux designer|ui designer|product designer|ux researcher|user experience designer|interaction designer", "ux_designer"),
    (r"account executive|sales manager|account manager|business development|sales lead|sales director|vp of sales", "sales_manager"),
    (r"finance manager|financial analyst|fp&a|financial planning|controller|vp finance|chief financial", "finance_manager"),
    (r"hr manager|human resources|talent acquisition|recruiter|people operations|hrbp|hr business partner", "hr_manager"),
    (r"devops engineer|site reliability|sre\b|platform engineer|cloud engineer|infrastructure engineer", "devops_engineer"),
    (r"cybersecurity|security engineer|information security|infosec|security analyst|penetration test", "security_engineer"),
    (r"content writer|content strategist|copywriter|technical writer|content manager|content creator", "content_writer"),
    (r"customer success|customer support|customer experience|client success|client services", "customer_success"),
    (r"supply chain|logistics manager|procurement|inventory manager|warehouse manager|sourcing", "supply_chain"),
    (r"accountant|accounting manager|bookkeeper|cpa\b|audit manager|staff accountant", "accountant"),
    (r"executive assistant|administrative assistant|office manager|executive admin|ea to", "executive_assistant"),
    (r"registered nurse|nursing|rn\b|clinical coordinator|healthcare administrator|medical director", "healthcare"),
    (r"teacher|educator|curriculum developer|instructional designer|learning specialist|professor", "educator"),
]

# =========================================================
# Seniority taxonomy
# Classified from job description text (case-insensitive, left-to-right).
# Returns '' when unclassified — safe to store, excluded from future
# filtered queries.
# =========================================================

SENIORITY_PATTERNS: list[tuple[str, str]] = [
    (
        r"director|vp\b|vice president|cto\b|ceo\b|coo\b|cpo\b|svp\b|evp\b|"
        r"head of\b|chief [a-z]+ officer",
        "executive",
    ),
    (
        r"\bsenior\b|\blead\b|\bprincipal\b|staff engineer|"
        r"7\+\s*years?|8\+\s*years?|10\+\s*years?",
        "senior",
    ),
    (
        r"\bjunior\b|entry.?level|associate [a-z]|0.?2 years?|recent graduate|"
        r"new grad|early career|internship|\bintern\b",
        "entry",
    ),
    (
        r"mid.?level|3.?5 years?|2.?4 years?|4.?6 years?|\bexperienced\b",
        "mid",
    ),
]

# =========================================================
# Synthetic priors — cold start fallback
# Injected ONLY when fewer than MIN_SAMPLE_SIZE real records exist.
# Grounded in common ATS keyword patterns for each role category.
# Quickly overridden as real scan_results data accumulates.
# =========================================================

SYNTHETIC_PRIORS: dict[str, list[str]] = {
    "product_manager": [
        "product roadmap", "OKRs", "user stories", "agile methodology", "sprint planning",
        "stakeholder alignment", "go-to-market strategy", "A/B testing", "KPIs", "product strategy",
    ],
    "software_engineer": [
        "CI/CD pipelines", "unit testing", "code review", "REST API design", "microservices",
        "system design", "version control", "agile", "cloud infrastructure", "technical documentation",
    ],
    "data_scientist": [
        "machine learning", "statistical modeling", "feature engineering", "model evaluation",
        "experimentation", "data visualization", "cross-functional collaboration", "A/B testing",
        "data pipeline", "predictive modeling",
    ],
    "data_analyst": [
        "data analysis", "SQL", "business intelligence", "dashboard development", "KPI tracking",
        "stakeholder reporting", "data visualization", "trend analysis", "data quality", "ad hoc analysis",
    ],
    "marketing_manager": [
        "brand strategy", "campaign management", "demand generation", "content strategy",
        "marketing analytics", "lead generation", "digital marketing", "budget management",
        "performance marketing", "customer acquisition",
    ],
    "operations_manager": [
        "process improvement", "cross-functional coordination", "SOP development", "vendor management",
        "project management", "stakeholder communication", "operational efficiency", "budget oversight",
        "team leadership", "performance metrics",
    ],
    "project_manager": [
        "project lifecycle", "risk management", "stakeholder management", "budget tracking",
        "resource planning", "agile methodology", "status reporting", "change management",
        "milestone tracking", "cross-functional teams",
    ],
    "ux_designer": [
        "user research", "usability testing", "wireframing", "prototyping", "design systems",
        "interaction design", "information architecture", "accessibility", "user journey mapping", "A/B testing",
    ],
    "sales_manager": [
        "pipeline management", "quota attainment", "account management", "CRM management",
        "revenue growth", "prospecting", "territory management", "sales forecasting",
        "objection handling", "customer retention",
    ],
    "finance_manager": [
        "financial modeling", "budgeting", "forecasting", "P&L management", "variance analysis",
        "financial reporting", "cost analysis", "cash flow management", "business partnering", "month-end close",
    ],
    "hr_manager": [
        "talent acquisition", "employee relations", "performance management", "HR compliance",
        "onboarding", "organizational development", "workforce planning", "benefits administration",
        "HRIS", "culture initiatives",
    ],
    "devops_engineer": [
        "CI/CD", "infrastructure as code", "container orchestration", "cloud platforms",
        "monitoring and alerting", "incident response", "security best practices",
        "automation", "SLA management", "system reliability",
    ],
    "security_engineer": [
        "threat modeling", "vulnerability assessment", "incident response", "security architecture",
        "compliance frameworks", "identity and access management", "SIEM", "penetration testing",
        "risk assessment", "security operations",
    ],
    "content_writer": [
        "content strategy", "SEO writing", "editorial calendar", "audience targeting", "brand voice",
        "content performance", "storytelling", "long-form content", "content distribution", "engagement metrics",
    ],
    "customer_success": [
        "customer onboarding", "retention strategies", "NPS tracking", "customer health scoring",
        "account management", "churn reduction", "upsell and cross-sell", "customer advocacy",
        "product adoption", "QBR facilitation",
    ],
    "supply_chain": [
        "inventory management", "demand planning", "supplier relationship management",
        "logistics coordination", "procurement strategy", "cost reduction", "ERP systems",
        "KPI tracking", "risk mitigation", "lean principles",
    ],
    "accountant": [
        "financial statements", "reconciliation", "month-end close", "GAAP compliance",
        "audit support", "accounts payable", "accounts receivable", "tax preparation",
        "variance analysis", "journal entries",
    ],
    "executive_assistant": [
        "calendar management", "executive support", "meeting coordination", "travel arrangements",
        "stakeholder communication", "confidentiality", "project coordination", "office management",
        "expense reporting", "cross-functional liaison",
    ],
    "healthcare": [
        "patient care", "clinical documentation", "HIPAA compliance", "care coordination",
        "quality improvement", "interdisciplinary collaboration", "evidence-based practice",
        "patient education", "electronic health records", "clinical protocols",
    ],
    "educator": [
        "curriculum development", "instructional design", "differentiated instruction",
        "student assessment", "classroom management", "learning outcomes", "data-driven instruction",
        "parent communication", "professional development", "educational technology",
    ],
}


# =========================================================
# Public API
# =========================================================

def extract_job_category(job_description: str) -> str:
    """
    Extract a canonical job category from raw job description text.
    Uses regex pattern matching — no AI, no network calls.

    Returns a category string (e.g. 'product_manager') or 'general' if no match.
    'general' is treated as a no-signal category (too broad to be useful).
    """
    if not job_description or not job_description.strip():
        return "general"

    text = job_description.lower()
    for pattern, category in ROLE_PATTERNS:
        if re.search(pattern, text):
            return category

    return "general"


def extract_seniority_level(job_description: str) -> str:
    """
    Classify seniority from job description text.

    Returns one of: 'entry', 'mid', 'senior', 'executive', or '' (unclassified).
    Unclassified ('') is stored as-is in scan_results.seniority_level.

    Research basis: TalentCLEF 2025 — seniority is the largest confounding
    variable in resume keyword analysis; senior and entry roles share category
    labels but have near-zero keyword overlap. BERT-based classifiers achieve
    ~92% accuracy; this regex approach provides sufficient precision for signal
    segmentation at scale without requiring an ML model.
    """
    if not job_description or not job_description.strip():
        return ""

    text = job_description.lower()
    for pattern, level in SENIORITY_PATTERNS:
        if re.search(pattern, text):
            return level

    return ""


def _parse_age_days(created_at_str: str | None) -> float:
    """
    Parse a Supabase ISO 8601 timestamp into record age in days.
    Returns 0.0 on parse failure (treats record as fresh — safe default).
    """
    if not created_at_str:
        return 0.0
    try:
        dt = datetime.fromisoformat(created_at_str.replace("Z", "+00:00"))
        now = datetime.now(timezone.utc)
        return max(0.0, (now - dt).total_seconds() / 86400.0)
    except Exception:
        return 0.0


def get_role_keywords(
    job_category: str,
    limit: int = MAX_KEYWORDS,
    seniority_level: str = "",
) -> list[str]:
    """
    Query scan_results for historical missing keywords in this job category.

    Scoring: decay-weighted frequency × mean(score_improvement), where:
    - decay_weight = e^(-DECAY_LAMBDA * days_since_record)
    - Records older than MAX_RECORD_AGE_DAYS are excluded entirely
    - Records with score_improvement >= MAX_PLAUSIBLE_IMPROVEMENT are excluded
      (gaming/circularity protection)
    - Only scan_type='optimize' rows with score_improvement > 0 are counted

    Cold start: when fewer than MIN_SAMPLE_SIZE qualifying records exist,
    returns SYNTHETIC_PRIORS for the category (or [] if no priors defined).

    Returns [] if:
    - job_category is 'general'
    - Supabase query fails (always fails silently — never blocks the optimizer)
    """
    if job_category == "general":
        logger.debug("keyword_intelligence: 'general' category — skipping injection")
        return []

    try:
        import httpx
        from services.supabase_service import _db_headers, _db_url

        # List-of-tuples so we can repeat score_improvement with different operators
        # (PostgREST treats repeated params for same column as AND conditions)
        params = [
            ("select", "missing_keywords,score_improvement,created_at"),
            ("job_category", f"eq.{job_category}"),
            ("scan_type", "eq.optimize"),
            ("score_improvement", "gt.0"),
            ("score_improvement", f"lt.{MAX_PLAUSIBLE_IMPROVEMENT}"),
        ]

        resp = httpx.get(
            _db_url("scan_results"),
            headers=_db_headers(),
            params=params,
            timeout=5,
        )
        resp.raise_for_status()
        rows = resp.json() or []

        # ── Cold start fallback ──────────────────────────────────────────────
        if len(rows) < MIN_SAMPLE_SIZE:
            priors = SYNTHETIC_PRIORS.get(job_category, [])
            if priors:
                injecting = priors[:limit]
                logger.info(
                    "keyword_intelligence: '%s' cold start (%d/%d records) "
                    "— injecting %d synthetic priors",
                    job_category, len(rows), MIN_SAMPLE_SIZE, len(injecting),
                )
                return injecting
            logger.debug(
                "keyword_intelligence: '%s' insufficient data (%d records) "
                "and no synthetic priors — skipping injection",
                job_category, len(rows),
            )
            return []

        # ── Decay-weighted aggregation ───────────────────────────────────────
        keyword_freq: Counter = Counter()
        keyword_score_sum: defaultdict = defaultdict(float)
        records_used = 0

        for row in rows:
            age_days = _parse_age_days(row.get("created_at"))

            # Hard cutoff — stale records contribute noise, not signal
            if age_days > MAX_RECORD_AGE_DAYS:
                continue

            decay_weight = math.exp(-DECAY_LAMBDA * age_days)
            improvement = float(row.get("score_improvement") or 0)
            records_used += 1

            keywords = row.get("missing_keywords") or []
            for kw in keywords:
                kw_clean = kw.strip().lower()
                if kw_clean:
                    keyword_freq[kw_clean] += decay_weight
                    keyword_score_sum[kw_clean] += improvement * decay_weight

        if not keyword_freq:
            return []

        # Score = decay-weighted frequency × mean score improvement
        scored = {
            kw: keyword_freq[kw] * (keyword_score_sum[kw] / keyword_freq[kw])
            for kw in keyword_freq
        }

        top_keywords = sorted(scored, key=lambda k: scored[k], reverse=True)[:limit]

        logger.info(
            "keyword_intelligence: '%s' seniority=%s — injecting %d signals "
            "from %d records (%d within age window, decay λ=%.2f)",
            job_category, seniority_level or "unclassified",
            len(top_keywords), len(rows), records_used, DECAY_LAMBDA,
        )
        return top_keywords

    except Exception as e:
        logger.warning(
            "keyword_intelligence: query failed (%s: %s) — skipping injection",
            type(e).__name__, e,
        )
        return []


def build_keyword_signal_block(keywords: list[str], job_category: str) -> str:
    """
    Format the keyword signal for injection into the optimizer user message.

    Includes an explicit GROUNDING RULE per ACL 2024 (Addlesee) research:
    telling Claude to treat injected keywords as signals to surface from
    existing experience — never as license to invent new experience.
    This is the primary guard against hallucination from injected context.

    Returns "" if keywords list is empty.
    """
    if not keywords:
        return ""

    kw_list = ", ".join(f'"{k}"' for k in keywords)
    role_label = job_category.replace("_", " ").title()

    return (
        f"\nPlatform signal ({role_label} roles): Anonymized data from previous users "
        f"in similar roles shows resumes that included the following terms saw measurable "
        f"ATS score improvements: {kw_list}.\n"
        f"GROUNDING RULE: Only incorporate these terms if the candidate's existing experience "
        f"honestly supports them. Do not invent, add, or imply any experience, responsibility, "
        f"or achievement not already present in the original resume. These are signals to "
        f"surface and emphasize from real experience — never prompts to fabricate new experience."
    )
