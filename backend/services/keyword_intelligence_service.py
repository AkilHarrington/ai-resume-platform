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
#
# This layer feeds signals INTO Claude — it never generates text itself.
# Claude handles all generation; this handles pattern recognition.
# =========================================================

import logging
import re
from collections import Counter, defaultdict

logger = logging.getLogger("ai_resume_studio.keyword_intelligence")

# =========================================================
# Config
# =========================================================

# Minimum qualifying scan_results records required before injecting signals.
# Below this threshold we have insufficient data — injecting adds noise, not value.
MIN_SAMPLE_SIZE = 10

# Maximum keywords to inject. More than 10 risks prompt dilution.
MAX_KEYWORDS = 8

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


def get_role_keywords(job_category: str, limit: int = MAX_KEYWORDS) -> list[str]:
    """
    Query scan_results for historical missing keywords in this job category.

    Scoring: frequency × mean(score_improvement) across all qualifying rows.
    Only 'optimize' scan_type rows with score_improvement > 0 are counted.

    Returns [] if:
    - job_category is 'general' (too broad for reliable signal)
    - fewer than MIN_SAMPLE_SIZE qualifying records exist for this category
    - Supabase query fails (fail silently — never blocks the optimizer)
    """
    if job_category == "general":
        return []

    try:
        from services.supabase_service import _get_client
        client = _get_client()

        result = (
            client.table("scan_results")
            .select("missing_keywords, score_improvement")
            .eq("job_category", job_category)
            .eq("scan_type", "optimize")
            .gt("score_improvement", 0)
            .execute()
        )

        rows = result.data or []

        if len(rows) < MIN_SAMPLE_SIZE:
            logger.debug(
                "keyword_intelligence: insufficient data for '%s' (%d records, need %d) — skipping injection",
                job_category, len(rows), MIN_SAMPLE_SIZE,
            )
            return []

        # Aggregate: count frequency and sum score_improvement per keyword
        keyword_freq: Counter = Counter()
        keyword_score_sum: defaultdict = defaultdict(float)

        for row in rows:
            keywords = row.get("missing_keywords") or []
            improvement = float(row.get("score_improvement") or 0)
            for kw in keywords:
                kw_clean = kw.strip().lower()
                if kw_clean:
                    keyword_freq[kw_clean] += 1
                    keyword_score_sum[kw_clean] += improvement

        if not keyword_freq:
            return []

        # Score = frequency × mean score improvement
        scored = {
            kw: keyword_freq[kw] * (keyword_score_sum[kw] / keyword_freq[kw])
            for kw in keyword_freq
        }

        top_keywords = sorted(scored, key=lambda k: scored[k], reverse=True)[:limit]

        logger.info(
            "keyword_intelligence: '%s' — injecting %d signals from %d historical records",
            job_category, len(top_keywords), len(rows),
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
