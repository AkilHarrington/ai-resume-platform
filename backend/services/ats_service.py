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
# - this remains deterministic matching logic for the MVP
# - improvements added:
#   1. unique keyword matching only
#   2. weighted scoring
#   3. basic synonym support
#   4. phrase handling for high-value JD concepts
#   5. keyword stuffing penalty
#   6. automatic phrase learning from job descriptions
# - frontend depends on the response shape from calculate_ats_score()
# =========================================================

import re


# =========================================================
# ATS Stopword Library
# =========================================================

STOPWORDS = {
    # Basic language
    "a", "an", "and", "are", "as", "at", "be", "by", "for", "from",
    "in", "is", "it", "of", "on", "or", "that", "the", "to", "with",
    "will", "this", "these", "those", "their", "there", "its",

    # Grammar / helper verbs
    "has", "have", "had", "having",
    "do", "does", "did",
    "can", "could", "may", "might",
    "must", "should", "would",

    # Job description filler
    "role", "position", "candidate", "candidates",
    "successful", "ideal", "looking", "seeking",
    "opportunity",

    # Resume generic filler
    "ability", "abilities",
    "skill", "skills",
    "knowledge",
    "experience", "experiences",
    "background",

    # Job description structure
    "responsibility", "responsibilities",
    "require", "requires", "required",
    "including", "include", "includes",

    # Generic verbs used in many job postings
    "support", "supporting",
    "provide", "providing",
    "assist", "assisting",
    "help", "helping",
    "ensure", "ensuring",
    "maintain", "maintaining",

    # Weak action verbs
    "build", "building",
    "drive", "driving",
    "deliver", "delivering",
    "improve", "improving",
    "optimize", "optimizing",
    "develop", "developing",
    "implement", "implementing",

    # Corporate fluff
    "success", "successful",
    "result", "results",
    "growth", "growing",

    # Adjective noise discovered during testing
    "strong",
    "excellent",
    "great",
    "good",
    "highly",

    # Organizational noise
    "team", "teams",
    "company", "organization",
    "environment", "environmental",
    "across", "within",

    # Resume filler verbs
    "work", "working",
    "based", "closely",

    # Misc noise discovered in ATS tests
    "through",
    "conduct",
    "protecting",
    "improvements",
    "requirements",
    "requirement",
    "responsible",
    "producing",
    "coordinating",
    "initiative",
    "initiatives",
}


# =========================================================
# Phrase / Synonym Configuration
# =========================================================

PHRASE_SYNONYMS = {
    "workforce planning": [
        "workforce planning",
        "labor forecasting",
        "staffing coordination",
        "staffing planning",
        "headcount planning",
    ],
    "project management": [
        "project management",
        "project coordination",
        "program management",
    ],
    "customer service": [
        "customer service",
        "client service",
        "customer support",
    ],
}

SYNONYM_MAP = {
    "excel": [
        "excel",
        "spreadsheets",
        "spreadsheet",
        "spreadsheet analysis",
        "excel dashboards",
    ],

    "reporting": [
        "reporting",
        "reports",
        "report",
        "performance tracking",
        "metrics reviews",
        "service metrics",
    ],

    "workforce": [
        "workforce",
        "staffing",
        "labor",
        "headcount",
        "coverage",
    ],

    "planning": [
        "planning",
        "forecasting",
        "coordination",
        "scheduling",
        "schedules",
    ],

    "communication": [
        "communication",
        "verbal communication",
        "written communication",
        "cross-team collaboration",
        "collaboration",
    ],

    "analyst": [
    "analyst",
    "analysis",
    "analyzing",
    "analytical",
    "data analysis",],

    "operations": [
        "operations",
        "operational",
        "support",
        "workflow",
    ],

    "management": [
        "management",
        "tracking",
        "oversight",
    ],

    "coordination": [
        "coordination",
        "scheduling",
    ],

    "api": [
        "api",
        "apis",
        "rest api",
        "rest apis",
        "api development",
        "rest api development",
    ],

    "accounting": [
        "accounting",
        "reconciliation",
        "financial records",
        "ledger",
        "general ledger",
    ],

    "forecasting": [
        "forecasting",
        "projections",
        "budget planning",
    ],

    "compliance": [
        "compliance",
        "controls",
        "policy adherence",
        "regulatory",
    ],

    "modeling": [
        "modeling",
        "financial modeling",
        "scenario modeling",
    ],

    "variance": [
        "variance",
        "variance analysis",
        "budget variance",
    ],
}

KEYWORD_WEIGHTS = {
    "excel": 2.0,
    "reporting": 2.0,
    "workforce": 2.0,
    "planning": 2.0,
    "workforce planning": 3.0,
    "analyst": 2.0,
    "operations": 1.5,
    "communication": 1.5,
    "project management": 2.5,
    "customer service": 1.5,
    "excellent": 0.5,
}


# =========================================================
# Keyword Normalization Helpers
# =========================================================

def normalize_word(word: str) -> str:
    """
    Normalize words for ATS matching without making displayed keywords ugly.
    """
    word = word.lower().strip()
    word = word.replace("’", "").replace("'", "")

    # Unify common analyst / analysis family terms
    if word in {"analysis", "analyzing", "analytical"}:
        return "analyst"

    if len(word) <= 3:
        return word

    if word.endswith("ies") and len(word) > 4:
        return word[:-3] + "y"

    if word.endswith("ing") and len(word) > 5:
        base = word[:-3]
        if not base.endswith("e") and base.endswith(("ag", "at", "iz", "ur")):
            return base + "e"
        return base

    if word.endswith("ed") and len(word) > 4:
        base = word[:-2]
        if not base.endswith("e") and base.endswith(("ag", "at", "iz", "ur")):
            return base + "e"
        return base

    if word.endswith("es") and len(word) > 4:
        if word.endswith(("sses", "shes", "ches", "xes", "zes")):
            return word[:-2]
        if not word.endswith("ness"):
            return word[:-1]

    if word.endswith("s") and len(word) > 4:
        if not word.endswith(("ss", "us", "is", "ness")):
            return word[:-1]

    return word


def normalize_phrase(phrase: str) -> str:
    """
    Normalize multi-word phrases using normalize_word() per token.
    """
    words = re.findall(r"\b[a-zA-Z][a-zA-Z\-&/]*\b", phrase.lower())
    normalized_words = [normalize_word(word) for word in words if len(word) > 1]
    return " ".join(normalized_words).strip()


def text_contains_variant(text: str, variant: str) -> bool:
    """
    Check whether a normalized text blob contains a whole-word variant.
    """
    escaped = re.escape(variant)
    pattern = rf"\b{escaped}\b"
    return re.search(pattern, text) is not None


def count_variant_occurrences(text: str, variant: str) -> int:
    """
    Count whole-word occurrences of a variant inside normalized text.
    """
    escaped = re.escape(variant)
    pattern = rf"\b{escaped}\b"
    return len(re.findall(pattern, text))


# =========================================================
# Keyword Extraction Logic
# =========================================================

def extract_keywords(text: str) -> tuple[set[str], dict[str, str], str]:
    """
    Extract meaningful keywords from text while removing stopwords and
    normalizing variants.

    Returns:
    - normalized keyword set for matching
    - display map for cleaner UI output
    - normalized text blob for phrase/synonym matching
    """
    words = re.findall(r"\b[a-zA-Z][a-zA-Z\-&/]*\b", text.lower())

    normalized_keywords = set()
    display_map = {}

    for raw_word in words:
        if len(raw_word) <= 2:
            continue

        if raw_word in STOPWORDS:
            continue

        normalized = normalize_word(raw_word)

        if normalized in STOPWORDS:
            continue

        if len(normalized) <= 2:
            continue

        normalized_keywords.add(normalized)

        if normalized not in display_map:
            display_map[normalized] = raw_word
        else:
            current = display_map[normalized]
            if len(raw_word) < len(current):
                display_map[normalized] = raw_word

    normalized_full_text = normalize_phrase(text)

    return normalized_keywords, display_map, normalized_full_text


def extract_job_phrases(job_description: str) -> list[str]:
    """
    Extract meaningful 2-word phrases from the job description.

    Rules:
    - only keep phrases where both words are useful keywords
    - skip weak/generic lead words
    - skip weak/generic trailing words
    - only keep phrases likely to represent real concepts
    """
    words = re.findall(r"\b[a-zA-Z][a-zA-Z\-&/]*\b", job_description.lower())
    normalized_words = [normalize_word(word) for word in words if len(word) > 2]

    weak_words = STOPWORDS.union({
        "strong",
        "experience",
        "knowledge",
        "skill",
        "skills",
        "seeking",
        "seek",
        "require",
        "required",
        "including",
        "support",
        "working",
        "closely",
    })

    allowed_heads = {
        "financial",
        "variance",
        "social",
        "marketing",
        "supply",
        "demand",
        "project",
        "customer",
        "cloud",
        "backend",
        "software",
        "patient",
        "infection",
        "clinical",
        "workforce",
        "digital",
        "content",
        "vendor",
        "warehouse",
        "shipment",
        "site",
        "budget",
        "accounting",
    }

    allowed_tails = {
        "analysis",
        "analytics",
        "planning",
        "management",
        "coordination",
        "compliance",
        "modeling",
        "reporting",
        "strategy",
        "operations",
        "development",
        "deployment",
        "architecture",
        "control",
        "care",
        "documentation",
        "monitoring",
        "delivery",
        "records",
        "forecasting",
    }

    phrases = set()

    for i in range(len(normalized_words) - 1):
        first = normalized_words[i]
        second = normalized_words[i + 1]

        if first in weak_words or second in weak_words:
            continue

        if len(first) <= 2 or len(second) <= 2:
            continue

        # Only keep phrases that look like real ATS concepts
        if first in allowed_heads or second in allowed_tails:
            phrase = f"{first} {second}".strip()
            phrases.add(phrase)

    return sorted(phrases)


# =========================================================
# Resume Flattening Logic
# =========================================================

def resume_to_text(resume_data: dict) -> str:
    """
    Flatten structured resume JSON into a single text blob for ATS analysis.
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
# Matching Helpers
# =========================================================

def build_canonical_keyword_data(job_keywords: set[str], job_display: dict[str, str], job_text: str) -> list[dict]:
    """
    Build the canonical keyword list from the job description.

    We score:
    1. predefined phrase concepts
    2. single-token keywords
    """
    canonical_items: list[dict] = []
    seen_canonicals = set()

    # 1. Add predefined phrase concepts found in the JD.
    for canonical_phrase, variants in PHRASE_SYNONYMS.items():
        normalized_variants = [normalize_phrase(variant) for variant in variants]
        if any(text_contains_variant(job_text, variant) for variant in normalized_variants):
            canonical_items.append(
                {
                    "canonical": canonical_phrase,
                    "display": canonical_phrase,
                    "weight": KEYWORD_WEIGHTS.get(canonical_phrase, 1.0),
                    "variants": normalized_variants,
                }
            )
            seen_canonicals.add(canonical_phrase)

    # 2. Add single-token keywords found in the JD.
    for keyword in sorted(job_keywords):
        if keyword in seen_canonicals:
            continue

        display = job_display.get(keyword, keyword)

        if keyword in SYNONYM_MAP:
            variants = [normalize_phrase(variant) for variant in SYNONYM_MAP[keyword]]
        else:
            variants = [keyword]

        canonical_items.append(
            {
                "canonical": keyword,
                "display": display,
                "weight": KEYWORD_WEIGHTS.get(keyword, 1.0),
                "variants": variants,
            }
        )

    return canonical_items


def keyword_matches_resume(item: dict, resume_keywords: set[str], resume_text: str) -> bool:
    """
    Determine whether a canonical JD keyword or phrase matches the resume.
    """
    for variant in item["variants"]:
        if " " in variant:
            if text_contains_variant(resume_text, variant):
                return True
        else:
            if variant in resume_keywords:
                return True

    return False


def calculate_stuffing_penalty(canonical_items: list[dict], resume_text: str) -> int:
    """
    Apply a small deterministic penalty when matched concepts appear
    unnaturally often in the resume text.
    """
    penalty = 0

    for item in canonical_items:
        weight = item["weight"]

        if weight < 1.0:
            continue

        max_occurrences = 0

        for variant in item["variants"]:
            occurrences = count_variant_occurrences(resume_text, variant)
            if occurrences > max_occurrences:
                max_occurrences = occurrences

        if max_occurrences >= 4:
            penalty += 3
        elif max_occurrences == 3:
            penalty += 1

    return min(penalty, 15)


# =========================================================
# ATS Scoring Logic
# =========================================================

def calculate_ats_score(resume_data: dict, job_description: str) -> dict:
    """
    Compare resume vs job description using normalized keywords while returning
    cleaner display keywords for the UI.

    Response shape:
    {
        "ats_score": int,
        "matched_keywords": list[str],
        "missing_keywords": list[str]
    }
    """
    resume_text_raw = resume_to_text(resume_data)

    resume_keywords, _resume_display, resume_text = extract_keywords(resume_text_raw)
    job_keywords, job_display, job_text = extract_keywords(job_description)

    canonical_items = build_canonical_keyword_data(job_keywords, job_display, job_text)

    if len(canonical_items) == 0:
        return {
            "ats_score": 0,
            "matched_keywords": [],
            "missing_keywords": [],
        }

    matched: list[str] = []
    missing: list[str] = []
    matched_weight = 0.0
    total_weight = 0.0

    seen_displays = set()
    scored_items: list[dict] = []

    for item in canonical_items:
        display = item["display"]
        weight = item["weight"]

        display_key = display.lower()
        if display_key in seen_displays:
            continue

        seen_displays.add(display_key)
        total_weight += weight
        scored_items.append(item)

        if keyword_matches_resume(item, resume_keywords, resume_text):
            matched.append(display)
            matched_weight += weight
        else:
            missing.append(display)

    if total_weight == 0:
        base_score = 0
    else:
        base_score = int((matched_weight / total_weight) * 100)

    stuffing_penalty = calculate_stuffing_penalty(scored_items, resume_text)
    final_score = max(0, base_score - stuffing_penalty)

    return {
        "ats_score": final_score,
        "matched_keywords": sorted(matched),
        "missing_keywords": sorted(missing),
    }