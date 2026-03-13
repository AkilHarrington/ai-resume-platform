# =========================================================
# File: main.py
# Purpose:
# FastAPI backend entry point for the current AI Resume Platform frontend.
#
# Responsibilities:
# - expose scan and optimize API routes for the React frontend
# - validate frontend payloads
# - orchestrate ATS scoring and resume optimization
# - return clean JSON responses used by the UI
#
# Notes:
# - legacy MVP routes were removed to keep this backend focused
# - heavy AI/business logic stays in service files
# - this file should remain routing/orchestration only
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

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

@app.options("/{rest_of_path:path}")
async def options_handler(rest_of_path: str):
    return {"status": "ok"}

# =========================================================
# Helpers
# =========================================================

def build_resume_data_from_text(resume_text: str) -> dict:
    """
    Convert raw resume text from the frontend into the minimal structured shape
    expected by the current ATS and optimization services.

    Current frontend sends raw text only, so we store it inside the
    professional_summary field as the source text payload.
    """
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
    """
    Flatten structured resume JSON into preview text for the frontend.

    This is used after optimization so the UI can render a readable full resume
    preview when the optimizer returns structured JSON.
    """
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


# =========================================================
# Health Check
# =========================================================

@app.get("/")
def root():
    """
    Basic health check route used to confirm the backend is running.
    """
    return {"message": "AI Resume Platform backend is running"}


# =========================================================
# Frontend API Routes
# =========================================================

@app.post("/api/resume/scan")
def resume_scan(data: ResumeScanRequest):
    """
    Scan raw resume text and return ATS analysis for the React frontend.
    """
    job_description = data.jobDescription or ""
    resume_data = build_resume_data_from_text(data.resumeText)

    ats = calculate_ats_score(resume_data, job_description)
    matched = ats.get("matched_keywords", [])
    missing = ats.get("missing_keywords", [])

    return {
        "overallScore": ats.get("ats_score", 0),
        "summary": "Resume scan completed successfully.",
        "previewText": data.resumeText,
        "matchedKeywords": matched,
        "missingKeywords": missing,
        "categoryScores": [
            {
                "name": "ATS Match",
                "score": ats.get("ats_score", 0),
                "feedback": [
                    f"Matched keywords: {len(matched)}",
                    f"Missing keywords: {len(missing)}",
                ],
            }
        ],
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
    """
    Optimize raw resume text against the target job description for the React frontend.
    """
    job_description = data.jobDescription or ""

    original_resume_data = {
        "full_name": "",
        "email": "",
        "phone": "",
        "location": "",
        "professional_summary": data.resumeText,
        "skills": [],
        "professional_experience": [],
        "education": [],
        "certifications": [],
    }

    original_ats = calculate_ats_score(original_resume_data, job_description)

    # Call a text-based optimizer instead of forcing structured JSON behavior
    optimized_resume_text = optimize_resume_text(
        data.resumeText,
        job_description,
        original_ats.get("missing_keywords", []),
    )

    if not optimized_resume_text or not optimized_resume_text.strip():
        optimized_resume_text = data.resumeText

    improved_resume_data = {
        "full_name": "",
        "email": "",
        "phone": "",
        "location": "",
        "professional_summary": optimized_resume_text,
        "skills": [],
        "professional_experience": [],
        "education": [],
        "certifications": [],
    }

    improved_ats = calculate_ats_score(improved_resume_data, job_description)

    if improved_ats.get("ats_score", 0) < original_ats.get("ats_score", 0):
        optimized_resume_text = data.resumeText
        improved_ats = original_ats

    return {
        "originalScore": original_ats.get("ats_score", 0),
        "optimizedScore": improved_ats.get("ats_score", 0),
        "scoreImprovement": improved_ats.get("ats_score", 0) - original_ats.get("ats_score", 0),
        "originalResumeText": data.resumeText,
        "optimizedResumeText": optimized_resume_text,
        "missingKeywordsBefore": original_ats.get("missing_keywords", []),
        "missingKeywordsAfter": improved_ats.get("missing_keywords", []),
    }