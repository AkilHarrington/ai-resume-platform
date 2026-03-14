# =========================================================
# File: main.py
# Purpose:
# FastAPI backend entry point for the current AI Resume Platform frontend.
# =========================================================

import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from models.optimize_models import ResumeOptimizeRequest
from models.scan_models import ResumeScanRequest
from services.ats_service import calculate_ats_score
from services.resume_service import optimize_resume_text

load_dotenv()

# =========================================================
# FastAPI App Initialization
# =========================================================

app = FastAPI(
    title="AI Resume Platform API",
    version="2.0.0",
)

origins_env = os.getenv("ALLOWED_ORIGINS", "")
allowed_origins = [origin.strip() for origin in origins_env.split(",") if origin.strip()]

if not allowed_origins:
    allowed_origins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://ai-resume-platform-frontend.onrender.com",
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# Helpers
# =========================================================

def build_resume_data_from_text(resume_text: str) -> dict:
    return {
        "full_name": "",
        "email": "",
        "phone": "",
        "location": "",
        "professional_summary": resume_text,
        "skills": [],
        "professional_experience": [],
        "education": [],
        "certifications": [],
    }


def resume_data_to_text(resume_data: dict) -> str:
    if not isinstance(resume_data, dict):
        return ""

    parts: list[str] = []

    full_name = str(resume_data.get("full_name", "")).strip()
    if full_name:
        parts.append(full_name)

    email = str(resume_data.get("email", "")).strip()
    phone = str(resume_data.get("phone", "")).strip()
    location = str(resume_data.get("location", "")).strip()

    if email:
        parts.append(email)
    if phone:
        parts.append(phone)
    if location:
        parts.append(location)

    summary = str(resume_data.get("professional_summary", "")).strip()
    if summary:
        parts.extend(["", "Professional Summary", "", summary])

    skills = resume_data.get("skills", [])
    if skills:
        parts.extend(["", "Skills", ""])
        parts.extend(str(skill).strip() for skill in skills if str(skill).strip())

    experience = resume_data.get("professional_experience", [])
    if experience:
        parts.extend(["", "Experience", ""])
        for role in experience:
            company = str(role.get("company", "")).strip()
            title = str(role.get("title", "")).strip()

            if company:
                parts.append(company)
            if title:
                parts.append(title)

            for bullet in role.get("description", []):
                bullet_text = str(bullet).strip()
                if bullet_text:
                    parts.append(f"• {bullet_text}")

            parts.append("")

    education = resume_data.get("education", [])
    if education:
        parts.extend(["Education", ""])
        parts.extend(str(item).strip() for item in education if str(item).strip())

    certifications = resume_data.get("certifications", [])
    if certifications:
        parts.extend(["", "Certifications", ""])
        parts.extend(str(item).strip() for item in certifications if str(item).strip())

    return "\n".join(line for line in parts if line is not None).strip()


def build_optimization_guidance(resume_text: str) -> dict:
    lowered = resume_text.lower()

    reasons = []
    bullet_lines = [
        line.strip()
        for line in resume_text.splitlines()
        if line.strip().startswith("•") or line.strip().startswith("-")
    ]

    leadership_terms = {
        "led", "lead", "managed", "manage", "oversaw", "oversee",
        "directed", "supervised", "owned", "headed",
    }

    metric_signals = {
        "%", "$", "increase", "decrease", "reduced", "improved",
        "grew", "saved", "raised", "cut", "boosted",
    }

    operations_terms = {
        "operations", "operational", "workflow", "process", "planning",
        "coordination", "reporting", "oversight",
    }

    has_leadership = any(term in lowered for term in leadership_terms)
    has_metrics = any(signal in lowered for signal in metric_signals)
    has_operations = any(term in lowered for term in operations_terms)

    if len(bullet_lines) < 4 or not has_metrics:
        reasons.append("The experience section lacks measurable accomplishments.")

    if not has_leadership:
        reasons.append("Leadership responsibilities are not clearly described.")

    if not has_operations:
        reasons.append("Operational responsibilities are not evident.")

    if not reasons:
        reasons.append("The current resume already appears close to its realistic optimization ceiling.")

    return {
        "title": "Optimization could not significantly improve this resume because:",
        "reasons": reasons,
        "suggestionsTitle": "Consider expanding your experience bullets with:",
        "suggestions": [
            "Actions you led",
            "Results you achieved",
            "Teams or processes you managed",
        ],
    }


# =========================================================
# Health Check
# =========================================================

@app.get("/")
def root():
    return {"message": "AI Resume Platform backend is running"}


@app.get("/health")
def health():
    return {"status": "ok"}


# =========================================================
# Frontend API Routes
# =========================================================

@app.post("/api/resume/scan")
def resume_scan(data: ResumeScanRequest):
    job_description = data.jobDescription or ""

    ats = calculate_ats_score(data.resumeText, job_description)
    matched = ats.get("matched_keywords", [])
    missing = ats.get("missing_keywords", [])
    category_scores = ats.get("category_scores", [])
    parsed_resume = ats.get("parsed_resume", {})
    match_intelligence = ats.get("match_intelligence", {})

    return {
        "overallScore": ats.get("ats_score", 0),
        "summary": "Resume scan completed successfully.",
        "previewText": data.resumeText,
        "parsedResume": parsed_resume,
        "matchedKeywords": matched,
        "missingKeywords": missing,
        "categoryScores": category_scores,
        "issues": [
            {
                "id": f"missing-keyword-{index}",
                "title": "Missing Keyword",
                "description": keyword,
                "severity": "medium",
            }
            for index, keyword in enumerate(missing, start=1)
        ],
        "recommendations": [
            f"Add or strengthen keyword: {keyword}"
            for keyword in missing
        ],
    }


@app.post("/api/resume/optimize")
def resume_optimize(data: ResumeOptimizeRequest):
    job_description = data.jobDescription or ""

    original_ats = calculate_ats_score(data.resumeText, job_description)

    optimized_resume_text = optimize_resume_text(
        data.resumeText,
        job_description,
        original_ats.get("missing_keywords", []),
        original_score=original_ats.get("ats_score", 0),
    )

    improved_ats = calculate_ats_score(optimized_resume_text, job_description)

    original_score = original_ats.get("ats_score", 0)
    improved_score = improved_ats.get("ats_score", 0)

    if original_score < 60:
        max_allowed_improvement = 15
    elif original_score < 75:
        max_allowed_improvement = 12
    else:
        max_allowed_improvement = 10

    reverted_to_original = False

    if improved_score - original_score > max_allowed_improvement:
        optimized_resume_text = data.resumeText
        improved_ats = original_ats
        reverted_to_original = True

    if improved_ats.get("ats_score", 0) < original_ats.get("ats_score", 0):
        optimized_resume_text = data.resumeText
        improved_ats = original_ats
        reverted_to_original = True

    final_score = improved_ats.get("ats_score", 0)

    optimization_guidance = None
    if reverted_to_original or final_score == original_score:
        optimization_guidance = build_optimization_guidance(data.resumeText)

    return {
        "originalScore": original_score,
        "optimizedScore": final_score,
        "scoreImprovement": final_score - original_score,
        "originalResumeText": data.resumeText,
        "optimizedResumeText": optimized_resume_text,
        "originalParsedResume": original_ats.get("parsed_resume", {}),
        "optimizedParsedResume": improved_ats.get("parsed_resume", {}),
        "missingKeywordsBefore": original_ats.get("missing_keywords", []),
        "missingKeywordsAfter": improved_ats.get("missing_keywords", []),
        "optimizationGuidance": optimization_guidance,
    }