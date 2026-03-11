# =========================================================
# File: services/ats_service.py
# Purpose:
# ATS keyword extraction and resume/job-description matching logic.
#
# Responsibilities:
# - normalize text for ATS-style keyword matching
# - remove low-value stopwords from job descriptions and resume text
# - flatten structured resume JSON into searchable text
# - calculate ATS score based on matched vs missing keywords
#
# Key Notes:
# - this is deterministic matching logic for the MVP
# - frontend depends on the response shape from calculate_ats_score()
# - stopword tuning is expected to evolve over time as more resume tests are run
# - future Phase 2 improvements may include smarter phrase weighting,
#   controlled variation, and more advanced matching rules
# =========================================================

# =========================================================
# Imports
# =========================================================

import re


# =========================================================
# ATS Stopword Library
# =========================================================

STOPWORDS = {
    # Basic language words
    "a", "an", "and", "are", "as", "at", "be", "by", "for", "from",
    "in", "is", "it", "of", "on", "or", "that", "the", "to", "with",
    "will", "this", "these", "those", "their", "there", "its",

    # Common job posting filler words
    "role", "position", "candidate", "successful", "strong",
    "ability", "abilities", "skills", "skill", "knowledge",
    "experience", "experiences", "background", "responsibilities",
    "responsibility", "require", "requires", "required",
    "including", "include", "includes",

    # Common business filler language
    "support", "supporting", "provide", "providing", "help",
    "helping", "assist", "assisting", "ensure", "ensuring",
    "maintain", "maintaining", "enable", "enabling",

    # Generic action verbs (low ATS value)
    "build", "building", "lead", "leading", "drive", "driving",
    "deliver", "delivering", "improve", "improving",
    "optimize", "optimizing", "develop", "developing",

    # Generic success language
    "success", "successful", "results", "result",
    "growth", "growing",

    # Job description structure words
    "team", "teams", "company", "organization",
    "across", "within", "environment", "environmental",

    # Misc filler from tests
    "work", "working", "based", "seeking", "closely",

    # Weak ATS filler words identified during testing
    "responsible", "through", "protecting", "conduct", "implement", "improvements",
}


# =========================================================
# Keyword Normalization Helpers
# =========================================================

def normalize_word(word: str) -> str:
    """
    Normalize words for ATS matching without making displayed keywords ugly.

    Goals:
    - manage / managed / managing -> manage
    - partner / partnered / partnering -> partner
    - strategy / strategies -> strategy
    - keep words like business, success, operations readable

    Notes:
    - This is intentionally lightweight and deterministic for MVP use.
    - The frontend still displays cleaner keyword variants using display_map.
    """
    word = word.lower().strip()
    word = word.replace("’", "").replace("'", "")

    # Skip very short words early
    if len(word) <= 3:
        return word

    # Convert plural "ies" to singular "y"
    # Example: strategies -> strategy
    if word.endswith("ies") and len(word) > 4:
        return word[:-3] + "y"

    # Convert "ing" forms where reasonable
    # Example: managing -> manage
    if word.endswith("ing") and len(word) > 5:
        base = word[:-3]
        if not base.endswith("e"):
            if base.endswith(("ag", "at", "iz", "ur")):
                return base + "e"
        return base

    # Convert "ed" forms where reasonable
    # Example: managed -> manage
    if word.endswith("ed") and len(word) > 4:
        base = word[:-2]
        if not base.endswith("e"):
            if base.endswith(("ag", "at", "iz", "ur")):
                return base + "e"
        return base

    # Safer plural handling for "es"
    # Example: classes -> class, processes -> process
    if word.endswith("es") and len(word) > 4:
        if word.endswith(("sses", "shes", "ches", "xes", "zes")):
            return word[:-2]

        # Avoid breaking words like "business"
        if not word.endswith("ness"):
            return word[:-1]

    # Safer singular handling for trailing "s"
    if word.endswith("s") and len(word) > 4:
        # Keep words like business, status, analysis
        if not word.endswith(("ss", "us", "is", "ness")):
            return word[:-1]

    return word


# =========================================================
# Keyword Extraction Logic
# =========================================================

def extract_keywords(text: str) -> tuple[set[str], dict[str, str]]:
    """
    Extract meaningful keywords from text while removing stopwords and
    normalizing variants.

    Returns:
    - normalized keyword set for matching
    - display map so UI shows clean words instead of stems

    Example:
    Input text:
        "Managing operations and reporting metrics"
    Output:
        normalized_keywords -> {"manage", "operation", "report", "metric"}
        display_map -> maps normalized form back to a cleaner source token
    """
    words = re.findall(r"\b[a-zA-Z][a-zA-Z\-&/]*\b", text.lower())

    normalized_keywords = set()
    display_map = {}

    for raw_word in words:
        if len(raw_word) <= 2:
            continue

        # Skip raw stopwords immediately
        if raw_word in STOPWORDS:
            continue

        normalized = normalize_word(raw_word)

        # Skip normalized stopwords too
        if normalized in STOPWORDS:
            continue

        if len(normalized) <= 2:
            continue

        normalized_keywords.add(normalized)

        # Prefer shorter / cleaner display keyword for UI presentation
        if normalized not in display_map:
            display_map[normalized] = raw_word
        else:
            current = display_map[normalized]
            if len(raw_word) < len(current):
                display_map[normalized] = raw_word

    return normalized_keywords, display_map


# =========================================================
# Resume Flattening Logic
# =========================================================

def resume_to_text(resume_data: dict) -> str:
    """
    Flatten structured resume JSON into a single text blob for ATS analysis.

    This allows the ATS scorer to compare:
    - professional summary
    - skills
    - job titles
    - employer names
    - experience bullets
    - education
    - certifications

    against the target job description.
    """
    parts = []

    parts.append(resume_data.get("full_name", ""))
    parts.append(resume_data.get("location", ""))
    parts.append(resume_data.get("phone", ""))
    parts.append(resume_data.get("email", ""))
    parts.append(resume_data.get("professional_summary", ""))

    for skill in resume_data.get("skills", []):
        parts.append(skill)

    for role in resume_data.get("professional_experience", []):
        parts.append(role.get("company", ""))
        parts.append(role.get("title", ""))
        for bullet in role.get("description", []):
            parts.append(bullet)

    for edu in resume_data.get("education", []):
        parts.append(edu)

    for cert in resume_data.get("certifications", []):
        parts.append(cert)

    return " ".join(parts)


# =========================================================
# ATS Scoring Logic
# =========================================================

def calculate_ats_score(resume_data: dict, job_description: str) -> dict:
    """
    Compare resume vs job description using normalized keywords
    while returning cleaner display keywords for the UI.

    Returns response shape expected by the frontend:
    {
        "ats_score": int,
        "matched_keywords": list[str],
        "missing_keywords": list[str]
    }

    Scoring logic:
    - score = matched keyword count / total JD keyword count * 100
    - simple deterministic ATS scoring for MVP stability
    """
    resume_text = resume_to_text(resume_data)

    resume_keywords, resume_display = extract_keywords(resume_text)
    job_keywords, job_display = extract_keywords(job_description)

    matched_normalized = sorted(resume_keywords.intersection(job_keywords))
    missing_normalized = sorted(job_keywords - resume_keywords)

    # Use the job description display form for cleaner UI output
    matched = [job_display.get(word, word) for word in matched_normalized]
    missing = [job_display.get(word, word) for word in missing_normalized]

    if len(job_keywords) == 0:
        score = 0
    else:
        score = int((len(matched_normalized) / len(job_keywords)) * 100)

    return {
        "ats_score": score,
        "matched_keywords": matched,
        "missing_keywords": missing,
    }