# =========================================================
# File: services/ats_service.py
# Purpose:
# ATS keyword extraction, industry detection, structured resume parsing,
# and multi-factor resume/job-description matching logic for
# the AI Resume Platform.
# =========================================================

import re

from services.resume_parser import parse_resume_text


STOPWORDS = {
    "a", "an", "and", "are", "as", "at", "be", "by", "for", "from",
    "in", "is", "it", "of", "on", "or", "that", "the", "to", "with",
    "will", "this", "these", "those", "their", "there", "its",
    "has", "have", "had", "having",
    "do", "does", "did",
    "can", "could", "may", "might",
    "must", "should", "would",
    "role", "position", "candidate", "candidates",
    "successful", "ideal", "looking", "seeking",
    "opportunity",
    "ability", "abilities",
    "skill", "skills",
    "knowledge",
    "experience", "experiences",
    "background",
    "responsibility", "responsibilities",
    "require", "requires", "required",
    "including", "include", "includes",
    "support", "supporting",
    "provide", "providing",
    "assist", "assisting",
    "help", "helping",
    "ensure", "ensuring",
    "maintain", "maintaining",
    "build", "building",
    "drive", "driving",
    "deliver", "delivering",
    "improve", "improving",
    "optimize", "optimizing",
    "develop", "developing",
    "implement", "implementing",
    "success", "successful",
    "result", "results",
    "growth", "growing",
    "strong",
    "excellent",
    "great",
    "good",
    "highly",
    "team", "teams",
    "company", "organization",
    "environment", "environmental",
    "across", "within",
    "work", "working",
    "based", "closely",
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
    "capabilities",
    "multiple",
    "times",
    "tools",
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
        "operational reporting",
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
    ],
    "operations": [
        "operations",
        "operational",
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
    "dashboards": [
        "dashboards",
        "dashboard",
        "visualizations",
        "data visualization",
    ],
}

INDUSTRY_KEYWORDS = {
    "healthcare": {
        "clinical", "hospital", "patient", "patients", "healthcare",
        "medical", "care", "nursing", "outpatient", "emergency",
        "compliance", "clinical operations",
    },
    "sports": {
        "athlete", "athletes", "sports", "coaching", "coach",
        "training", "performance", "workload", "recovery",
        "match", "league", "conditioning", "sports science",
    },
    "construction": {
        "construction", "contractor", "contractors", "infrastructure",
        "project site", "site", "scheduling", "budgeting",
        "regulatory compliance", "risk management",
    },
    "finance": {
        "accounting", "forecasting", "variance", "budget",
        "financial", "compliance", "ledger", "reconciliation",
        "modeling", "analysis",
    },
    "technology": {
        "software", "api", "apis", "engineering", "developer",
        "developers", "frontend", "backend", "cloud", "database",
        "platform", "systems",
    },
}

LEADERSHIP_TERMS = {
    "lead", "led", "leading", "leadership",
    "manage", "managed", "managing", "manager", "management",
    "oversee", "oversaw", "oversight",
    "direct", "directed", "director",
    "head", "headed", "own", "owned", "owner",
    "supervise", "supervised", "supervising",
    "execute", "executed",
    "strategy", "strategic",
}

ACTION_TERMS = {
    "improved", "implemented", "built", "developed", "managed",
    "analyzed", "created", "optimized", "coordinated", "directed",
    "led", "presented", "designed", "reduced", "increased",
    "established", "launched", "delivered", "executed", "monitored",
    "manage", "implement", "develop", "coordinate", "present",
    "analyze", "support", "improve", "oversee",
}


def normalize_word(word: str) -> str:
    word = word.lower().strip()
    word = word.replace("’", "").replace("'", "")

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


def apply_synonym_map(keywords: set[str]) -> set[str]:
    expanded = set(keywords)

    for canonical, variants in SYNONYM_MAP.items():
        normalized_variants = {normalize_word(v) for v in variants}
        if expanded.intersection(normalized_variants):
            expanded.add(canonical)

    return expanded


def extract_keywords(text: str) -> tuple[set[str], dict[str, str]]:
    words = re.findall(r"\b[a-zA-Z][a-zA-Z\-&/]*\b", text.lower())

    normalized_keywords: set[str] = set()
    display_map: dict[str, str] = {}

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

    normalized_keywords = apply_synonym_map(normalized_keywords)

    for canonical, variants in SYNONYM_MAP.items():
        if canonical not in display_map:
            for variant in variants:
                variant_norm = normalize_word(variant)
                if variant_norm in normalized_keywords:
                    display_map[canonical] = variant
                    break

    return normalized_keywords, display_map


def detect_industry(text: str) -> str:
    lowered = text.lower()
    scores: dict[str, int] = {}

    for industry, keywords in INDUSTRY_KEYWORDS.items():
        scores[industry] = sum(1 for keyword in keywords if keyword in lowered)

    best_industry = "general"
    best_score = 0

    for industry, score in scores.items():
        if score > best_score:
            best_industry = industry
            best_score = score

    return best_industry if best_score >= 2 else "general"


def parsed_resume_to_ats_schema(parsed_resume: dict) -> dict:
    experience_entries = []

    for item in parsed_resume.get("experience", []) or []:
        experience_entries.append(
            {
                "company": item.get("company", ""),
                "title": item.get("title", ""),
                "description": item.get("bullets", []) or [],
            }
        )

    education_entries = []
    for item in parsed_resume.get("education", []) or []:
        if isinstance(item, dict):
            parts = [
                item.get("institution", ""),
                item.get("degree", ""),
                item.get("fieldOfStudy", ""),
            ]
            education_entries.append(" — ".join(part for part in parts if part))
        else:
            education_entries.append(str(item))

    certification_entries = []
    for item in parsed_resume.get("certifications", []) or []:
        if isinstance(item, dict):
            if item.get("name"):
                certification_entries.append(item.get("name", ""))
        else:
            certification_entries.append(str(item))

    return {
        "full_name": parsed_resume.get("fullName", ""),
        "email": parsed_resume.get("contact", {}).get("email", "") or "",
        "phone": parsed_resume.get("contact", {}).get("phone", "") or "",
        "location": parsed_resume.get("contact", {}).get("location", "") or "",
        "professional_summary": parsed_resume.get("summary", "") or "",
        "skills": parsed_resume.get("skills", []) or [],
        "professional_experience": experience_entries,
        "education": education_entries,
        "certifications": certification_entries,
    }


def normalize_resume_input(resume_input) -> dict:
    if isinstance(resume_input, str):
        parsed_resume = parse_resume_text(resume_input)
        return parsed_resume_to_ats_schema(parsed_resume)

    if isinstance(resume_input, dict):
        if "professional_summary" in resume_input or "professional_experience" in resume_input:
            return resume_input

        if "fullName" in resume_input or "experience" in resume_input:
            return parsed_resume_to_ats_schema(resume_input)

    return {
        "full_name": "",
        "email": "",
        "phone": "",
        "location": "",
        "professional_summary": "",
        "skills": [],
        "professional_experience": [],
        "education": [],
        "certifications": [],
    }


def resume_to_text(resume_data: dict) -> str:
    parts = []

    parts.append(str(resume_data.get("full_name", "")))
    parts.append(str(resume_data.get("location", "")))
    parts.append(str(resume_data.get("phone", "")))
    parts.append(str(resume_data.get("email", "")))
    parts.append(str(resume_data.get("professional_summary", "")))

    for skill in resume_data.get("skills", []):
        parts.append(str(skill))

    for role in resume_data.get("professional_experience", []):
        parts.append(str(role.get("company", "")))
        parts.append(str(role.get("title", "")))
        for bullet in role.get("description", []):
            parts.append(str(bullet))

    for edu in resume_data.get("education", []):
        parts.append(str(edu))

    for cert in resume_data.get("certifications", []):
        parts.append(str(cert))

    return " ".join(part for part in parts if part).strip()


def score_keyword_alignment(
    resume_keywords: set[str],
    job_keywords: set[str],
) -> tuple[int, list[str], list[str]]:
    matched_normalized = sorted(resume_keywords.intersection(job_keywords))
    missing_normalized = sorted(set(job_keywords - resume_keywords))

    if len(job_keywords) == 0:
        raw_score = 0
    else:
        raw_score = int((len(matched_normalized) / len(job_keywords)) * 100)

    weighted_score = round(raw_score * 0.40)
    return weighted_score, matched_normalized, missing_normalized


def score_experience_strength(resume_data: dict) -> int:
    roles = resume_data.get("professional_experience", [])
    if not roles:
        return 0

    bullet_count = 0
    action_bullet_count = 0

    for role in roles:
        for bullet in role.get("description", []):
            text = str(bullet).strip()
            if not text:
                continue

            bullet_count += 1
            lowered = text.lower()

            if any(term in lowered for term in ACTION_TERMS):
                action_bullet_count += 1

    if bullet_count == 0:
        raw_score = 0
    else:
        raw_score = min(100, int((action_bullet_count / bullet_count) * 100) + 40)

    return round(raw_score * 0.25)


def score_leadership_strength(resume_data: dict) -> int:
    text = resume_to_text(resume_data).lower()
    leadership_hits = sum(1 for term in LEADERSHIP_TERMS if term in text)

    raw_score = min(100, leadership_hits * 12)
    return round(raw_score * 0.10)


def score_section_completeness(resume_data: dict) -> int:
    checks = [
        bool(str(resume_data.get("full_name", "")).strip()),
        bool(str(resume_data.get("professional_summary", "")).strip()),
        bool(resume_data.get("skills", [])),
        bool(resume_data.get("professional_experience", [])),
        bool(resume_data.get("education", [])),
    ]

    completed = sum(1 for item in checks if item)
    raw_score = int((completed / len(checks)) * 100)

    return round(raw_score * 0.15)


def score_industry_alignment(resume_text: str, job_description: str) -> tuple[int, str, str]:
    resume_industry = detect_industry(resume_text)
    job_industry = detect_industry(job_description)

    if resume_industry == "general" and job_industry == "general":
        raw_score = 95
    elif resume_industry == "general" or job_industry == "general":
        raw_score = 80
    elif resume_industry == job_industry:
        raw_score = 100
    else:
        raw_score = 0

    return round(raw_score * 0.10), resume_industry, job_industry


def calculate_ats_score(resume_input, job_description: str) -> dict:
    resume_data = normalize_resume_input(resume_input)
    resume_text = resume_to_text(resume_data)

    resume_keywords, _resume_display = extract_keywords(resume_text)
    job_keywords, job_display = extract_keywords(job_description)

    keyword_score, matched_normalized, missing_normalized = score_keyword_alignment(
        resume_keywords,
        job_keywords,
    )
    experience_score = score_experience_strength(resume_data)
    leadership_score = score_leadership_strength(resume_data)
    completeness_score = score_section_completeness(resume_data)
    industry_score, resume_industry, job_industry = score_industry_alignment(
        resume_text,
        job_description,
    )

    matched = [job_display.get(word, word) for word in matched_normalized]
    missing = sorted(set(job_display.get(word, word) for word in missing_normalized))

    final_score = min(
        100,
        keyword_score
        + experience_score
        + leadership_score
        + completeness_score
        + industry_score,
    )

    return {
        "ats_score": final_score,
        "matched_keywords": matched,
        "missing_keywords": missing,
        "resume_industry": resume_industry,
        "job_industry": job_industry,
        "parsed_resume": resume_data,
        "category_scores": [
            {
                "name": "Keyword Alignment",
                "score": keyword_score,
                "feedback": [
                    f"Matched keywords: {len(matched)}",
                    f"Missing keywords: {len(missing)}",
                ],
            },
            {
                "name": "Experience Strength",
                "score": experience_score,
                "feedback": [
                    "Measures action-oriented experience content.",
                ],
            },
            {
                "name": "Leadership Strength",
                "score": leadership_score,
                "feedback": [
                    "Measures leadership and ownership language.",
                ],
            },
            {
                "name": "Section Completeness",
                "score": completeness_score,
                "feedback": [
                    "Measures presence of core resume sections.",
                ],
            },
            {
                "name": "Industry Alignment",
                "score": industry_score,
                "feedback": [
                    f"Resume industry: {resume_industry}",
                    f"Job industry: {job_industry}",
                ],
            },
        ],
    }