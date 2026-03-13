# =========================================================
# File: services/domain_guardrails.py
# Purpose:
# Generalized domain mismatch detection and hallucination prevention
# across multiple industries.
#
# Responsibilities:
# - define transferable cross-industry language
# - define domain-specific vocabulary by industry
# - detect newly introduced target-domain terms in optimized output
# - provide rejection logic for unsupported cross-domain rewrites
# =========================================================


# =========================================================
# Transferable Cross-Industry Vocabulary
# =========================================================

TRANSFERABLE_TERMS = {
    "leadership",
    "analytics",
    "analysis",
    "operations",
    "operational",
    "reporting",
    "coordination",
    "planning",
    "strategy",
    "strategic",
    "management",
    "oversight",
    "collaboration",
    "cross-functional",
    "stakeholder",
    "execution",
    "optimization",
    "efficiency",
    "improvement",
    "decision-making",
    "performance",
    "workflow",
    "process",
    "monitoring",
    "delivery",
    "team leadership",
    "process improvement",
    "resource planning",
    "data-driven",
    "problem-solving",
}


# =========================================================
# Domain-Specific Vocabulary by Industry
# =========================================================

DOMAIN_TERMS = {
    "healthcare": {
        "clinical",
        "patient",
        "patients",
        "hospital",
        "hospitals",
        "medical",
        "nursing",
        "care delivery",
        "outpatient",
        "inpatient",
        "emergency",
        "healthcare compliance",
        "clinical operations",
        "patient outcomes",
        "care coordination",
        "clinical workflow",
        "hospital operations",
        "patient throughput",
    },
    "sports": {
        "athlete",
        "athletes",
        "coaching",
        "coach",
        "training",
        "sports science",
        "conditioning",
        "match",
        "league",
        "recovery",
        "workload",
        "player development",
        "tactical",
        "performance analytics",
        "athlete monitoring",
        "gps tracking",
        "training load",
    },
    "construction": {
        "construction",
        "contractor",
        "contractors",
        "infrastructure",
        "job site",
        "site safety",
        "project site",
        "blueprints",
        "subcontractors",
        "building code",
        "construction scheduling",
        "estimating",
        "civil works",
        "site operations",
        "project controls",
    },
    "finance": {
        "financial modeling",
        "forecasting",
        "variance",
        "budgeting",
        "ledger",
        "reconciliation",
        "accounting",
        "cash flow",
        "audit",
        "financial controls",
        "fp&a",
        "general ledger",
        "investment analysis",
        "financial reporting",
        "budget variance",
    },
    "technology": {
        "software",
        "api",
        "apis",
        "backend",
        "frontend",
        "cloud",
        "database",
        "system architecture",
        "deployment",
        "microservices",
        "engineering",
        "devops",
        "platform",
        "infrastructure as code",
        "version control",
        "ci/cd",
        "scalability",
    },
    "legal": {
        "legal research",
        "litigation",
        "contract drafting",
        "case law",
        "counsel",
        "legal writing",
        "discovery",
        "corporate governance",
        "statutory",
        "paralegal",
        "regulatory filing",
        "legal compliance",
        "due diligence",
    },
    "education": {
        "curriculum",
        "instruction",
        "student outcomes",
        "classroom",
        "assessment",
        "teaching",
        "faculty",
        "academic",
        "pedagogy",
        "learning objectives",
        "student support",
        "school administration",
        "educational leadership",
    },
    "government": {
        "public administration",
        "policy",
        "procurement",
        "public sector",
        "municipal",
        "government operations",
        "agency",
        "compliance reporting",
        "program administration",
        "regulatory agency",
        "stakeholder engagement",
    },
    "manufacturing": {
        "production",
        "plant",
        "lean manufacturing",
        "quality control",
        "supply chain",
        "assembly",
        "equipment",
        "shop floor",
        "throughput",
        "process engineering",
        "inventory control",
        "plant operations",
        "production planning",
    },
    "marketing": {
        "brand strategy",
        "campaign",
        "seo",
        "content marketing",
        "lead generation",
        "conversion",
        "audience",
        "paid media",
        "go-to-market",
        "market research",
        "funnel",
        "crm",
        "campaign performance",
    },
    "logistics": {
        "supply chain",
        "inventory",
        "distribution",
        "warehouse",
        "freight",
        "transportation",
        "procurement",
        "fulfillment",
        "demand planning",
        "vendor management",
        "shipment",
        "route planning",
        "logistics operations",
    },
}


# =========================================================
# Helpers
# =========================================================

def normalize_phrase(text: str) -> str:
    """
    Normalize text/phrases for matching.
    """
    return " ".join(text.lower().strip().split())


def get_domain_terms(industry: str) -> set[str]:
    """
    Return the domain vocabulary for a given industry.
    """
    return DOMAIN_TERMS.get(industry, set())


def detect_new_domain_terms(
    original_text: str,
    optimized_text: str,
    target_industry: str,
) -> list[str]:
    """
    Detect target-industry terms that appear in optimized output
    but were absent from the original resume text.
    """
    original_lower = normalize_phrase(original_text)
    optimized_lower = normalize_phrase(optimized_text)

    added = []
    for term in get_domain_terms(target_industry):
        normalized_term = normalize_phrase(term)
        if normalized_term in optimized_lower and normalized_term not in original_lower:
            added.append(term)

    return sorted(set(added))


def should_reject_cross_domain_rewrite(
    original_text: str,
    optimized_text: str,
    resume_industry: str,
    job_industry: str,
    max_new_terms: int = 3,
) -> bool:
    """
    Reject optimized output when it introduces too many new
    target-domain terms in a cross-industry scenario.

    Rules:
    - empty output => reject
    - same industry => do not reject here
    - general/unknown industry => do not reject here
    - cross-industry + too many new target-domain terms => reject
    """
    if not optimized_text.strip():
        return True

    if resume_industry == "general" or job_industry == "general":
        return False

    if resume_industry == job_industry:
        return False

    new_domain_terms = detect_new_domain_terms(
        original_text=original_text,
        optimized_text=optimized_text,
        target_industry=job_industry,
    )

    return len(new_domain_terms) >= max_new_terms