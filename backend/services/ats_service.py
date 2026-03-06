import re


STOPWORDS = {
    "the", "and", "for", "with", "from", "that", "this", "will", "into", "across",
    "their", "about", "while", "where", "which", "have", "has", "had", "been",
    "being", "were", "was", "are", "is", "as", "at", "by", "to", "of", "in", "on",
    "or", "an", "a", "be", "it", "its", "than", "then", "them", "they", "he",
    "she", "you", "your", "our", "we", "us", "responsible", "responsibilities",
    "requirements", "required", "seeking", "experienced", "strong", "closely",
    "company", "organization", "growing", "guide", "making", "based", "team",
    "background", "drive", "work", "leader", "leaders", "large", "improve",
    "partner", "partners", "oversee", "knowledge", "projects", "fast-growing",
    "decision-making", "manage", "managing", "lead", "mentor", "recruit"
}

IMPORTANT_KEYWORDS = {
    "engineering", "architecture", "cloud", "distributed", "kubernetes", "docker",
    "devops", "platform", "microservices", "scalability", "reliability", "ci/cd",
    "technical", "leadership", "systems", "infrastructure", "agile", "api"
}


def normalize_text(text: str) -> list[str]:
    text = text.lower()
    text = text.replace("ci/cd", "cicd")
    text = text.replace("cloud-based", "cloud")
    text = text.replace("decision-making", "decisionmaking")
    return re.findall(r"\b[a-zA-Z][a-zA-Z+\-/&]{2,}\b", text)


def normalize_keyword(word: str) -> str:
    word = word.lower()
    word = word.replace("ci/cd", "cicd")
    word = word.replace("cloud-based", "cloud")
    word = word.replace("decision-making", "decisionmaking")
    return word


def calculate_ats_score(resume_data, job_description):
    resume_parts = []

    resume_parts.append(resume_data.get("professional_summary", ""))

    for skill in resume_data.get("skills", []):
        resume_parts.append(skill)

    for role in resume_data.get("professional_experience", []):
        resume_parts.append(role.get("company", ""))
        resume_parts.append(role.get("title", ""))
        for bullet in role.get("description", []):
            resume_parts.append(bullet)

    for item in resume_data.get("education", []):
        resume_parts.append(item)

    for item in resume_data.get("certifications", []):
        resume_parts.append(item)

    resume_text = " ".join(resume_parts)
    resume_words = set(normalize_text(resume_text))

    raw_job_words = normalize_text(job_description)

    filtered_job_keywords = []
    for word in raw_job_words:
        normalized = normalize_keyword(word)
        if normalized not in STOPWORDS and len(normalized) >= 4:
            filtered_job_keywords.append(normalized)

    unique_job_keywords = sorted(set(filtered_job_keywords))

    matched = []
    missing = []

    weighted_total = 0
    weighted_score = 0

    for keyword in unique_job_keywords:
        weight = 2 if keyword in IMPORTANT_KEYWORDS or keyword.replace("cicd", "ci/cd") in IMPORTANT_KEYWORDS else 1
        weighted_total += weight

        if keyword in resume_words:
            matched.append(keyword)
            weighted_score += weight
        else:
            missing.append(keyword)

    if weighted_total == 0:
        score = 0
    else:
        score = int((weighted_score / weighted_total) * 100)

    # Small realism boost for strong structured resumes
    has_summary = bool(resume_data.get("professional_summary"))
    has_skills = len(resume_data.get("skills", [])) >= 8
    has_experience = len(resume_data.get("professional_experience", [])) >= 2

    if has_summary and has_skills and has_experience:
        score = min(score + 5, 100)

    return {
        "ats_score": score,
        "matched_keywords": matched[:20],
        "missing_keywords": missing[:20]
    }