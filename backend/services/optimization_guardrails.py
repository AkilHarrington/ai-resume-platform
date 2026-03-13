# =========================================================
# File: services/optimization_guardrails.py
# Purpose:
# Select safe optimization modes for the resume optimizer.
#
# Responsibilities:
# - detect optimization mode from resume/JD industry relationship
# - support conservative handling for cross-industry optimization
# - support light-touch handling for already-strong resumes
# =========================================================

from services.ats_service import detect_industry


# =========================================================
# Industry Relationship Map
# Purpose:
# - define whether two industries are close enough to be treated as adjacent
# - default to mismatch when not explicitly mapped
# =========================================================

INDUSTRY_RELATIONSHIPS = {
    ("technology", "finance"): "adjacent",
    ("finance", "technology"): "adjacent",
    ("marketing", "sales"): "adjacent",
    ("sales", "marketing"): "adjacent",
    ("logistics", "manufacturing"): "adjacent",
    ("manufacturing", "logistics"): "adjacent",
    ("government", "education"): "adjacent",
    ("education", "government"): "adjacent",
}


def get_industry_relationship(resume_industry: str, job_industry: str) -> str:
    """
    Return the relationship between industries:
    - same
    - adjacent
    - mismatch
    """
    if resume_industry == job_industry:
        return "same"

    if resume_industry == "general" or job_industry == "general":
        return "mismatch"

    return INDUSTRY_RELATIONSHIPS.get((resume_industry, job_industry), "mismatch")


def detect_optimization_mode(
    resume_text: str,
    job_description: str,
    original_score: int,
) -> dict:
    """
    Determine the safest optimization mode.

    Modes:
    - high_match_polish:
        already strong score; apply light-touch improvements only
    - same_industry:
        same domain; optimize normally but truthfully
    - cross_industry_transferable:
        preserve original domain and optimize using transferable strengths
    """
    resume_industry = detect_industry(resume_text)
    job_industry = detect_industry(job_description)
    relationship = get_industry_relationship(resume_industry, job_industry)

    if original_score >= 85:
        mode = "high_match_polish"
    elif relationship == "same" and resume_industry != "general":
        mode = "same_industry"
    else:
        mode = "cross_industry_transferable"

    return {
        "mode": mode,
        "resume_industry": resume_industry,
        "job_industry": job_industry,
        "industry_relationship": relationship,
        "original_score": original_score,
    }