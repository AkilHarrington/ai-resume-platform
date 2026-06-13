# =========================================================
# File: main.py
# Purpose:
# FastAPI backend for AI Resume Studio.
# =========================================================

import io
import os

import stripe
from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from models.optimize_models import ResumeOptimizeRequest
from models.scan_models import ResumeScanRequest
from models.cover_letter_models import CoverLetterRequest
from models.linkedin_models import LinkedInRequest
from services.ats_service import calculate_ats_score
from services.semantic_ats_service import semantic_ats_score
from services.resume_service import (
    optimize_resume_text,
    generate_cover_letter,
    generate_linkedin_optimization,
)
from services.resume_parser import parse_resume_text

load_dotenv()

stripe.api_key = os.getenv("STRIPE_SECRET_KEY", "")

# =========================================================
# App
# =========================================================

app = FastAPI(title="AI Resume Studio API", version="3.0.0")

origins_env = os.getenv("ALLOWED_ORIGINS", "")
allowed_origins = [o.strip() for o in origins_env.split(",") if o.strip()]
if not allowed_origins:
    allowed_origins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://ai-resume-studio.vercel.app",
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# Constants
# =========================================================

MAX_UPLOAD_BYTES = 5 * 1024 * 1024  # 5 MB


# =========================================================
# Helpers
# =========================================================

def build_optimization_guidance(resume_text: str) -> dict:
    lowered = resume_text.lower()
    bullet_lines = [
        l.strip() for l in resume_text.splitlines()
        if l.strip().startswith("•") or l.strip().startswith("-")
    ]
    has_metrics = any(s in lowered for s in {"%", "$", "increase", "decrease", "reduced", "improved", "grew", "saved"})
    has_leadership = any(t in lowered for t in {"led", "managed", "oversaw", "directed", "supervised", "owned"})
    has_operations = any(t in lowered for t in {"operations", "workflow", "process", "planning", "coordination"})

    reasons = []
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
        "suggestions": ["Actions you led", "Results you achieved", "Teams or processes you managed"],
    }


def extract_text_from_upload(file: UploadFile) -> str:
    content = file.file.read()
    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="File too large. Maximum upload size is 5 MB.")
    filename = (file.filename or "").lower()

    if filename.endswith(".pdf"):
        try:
            import pdfplumber
            import re as _re
            with pdfplumber.open(io.BytesIO(content)) as pdf:
                text = "\n".join(page.extract_text() or "" for page in pdf.pages).strip()
            # Replace PDF glyph IDs (e.g. bullet chars rendered as (cid:127)) with •
            text = _re.sub(r'\(cid:\d+\)', '•', text)
            return text
        except Exception:
            raise HTTPException(status_code=422, detail="Could not extract text from PDF.")

    if filename.endswith(".docx"):
        try:
            import docx
            doc = docx.Document(io.BytesIO(content))
            return "\n".join(p.text for p in doc.paragraphs if p.text.strip()).strip()
        except Exception:
            raise HTTPException(status_code=422, detail="Could not extract text from DOCX.")

    try:
        return content.decode("utf-8").strip()
    except Exception:
        raise HTTPException(status_code=422, detail="Unsupported file format. Please upload PDF, DOCX, or plain text.")


# =========================================================
# Health
# =========================================================

@app.get("/")
def root():
    return {"message": "AI Resume Studio API", "version": "3.0.0"}

@app.get("/health")
def health():
    return {"status": "ok"}


# =========================================================
# Resume Upload
# =========================================================

@app.post("/api/resume/upload")
async def resume_upload(file: UploadFile = File(...)):
    resume_text = extract_text_from_upload(file)
    if not resume_text:
        raise HTTPException(status_code=422, detail="No text could be extracted from the file.")
    parsed = parse_resume_text(resume_text)
    return {"resumeText": resume_text, "parsedResume": parsed}


# =========================================================
# ATS Scan
# =========================================================

@app.post("/api/resume/scan")
def resume_scan(data: ResumeScanRequest):
    job_description = data.jobDescription or ""

    # Use Claude semantic scorer when a JD is provided; fall back to rule-based otherwise
    if job_description.strip():
        ats = semantic_ats_score(data.resumeText, job_description)
    else:
        ats = calculate_ats_score(data.resumeText, job_description)

    matched = ats.get("matched_keywords", [])
    missing = ats.get("missing_keywords", [])

    return {
        "overallScore": ats.get("ats_score", 0),
        "summary": "Resume scan completed successfully.",
        "previewText": data.resumeText,
        "parsedResume": ats.get("parsed_resume", {}),
        "matchedKeywords": matched,
        "missingKeywords": missing,
        "categoryScores": ats.get("category_scores", []),
        "matchIntelligence": ats.get("match_intelligence", {}),
        "strengths": ats.get("strengths", []),
        "gaps": ats.get("gaps", []),
        "recruiterVerdict": ats.get("recruiter_verdict", ""),
        "semantic": ats.get("semantic", False),
        "issues": [
            {"id": f"missing-keyword-{i}", "title": "Missing Keyword", "description": kw, "severity": "medium"}
            for i, kw in enumerate(missing, start=1)
        ],
        "recommendations": [f"Add or strengthen keyword: {kw}" for kw in missing],
    }


# =========================================================
# Resume Optimize
# =========================================================

@app.post("/api/resume/optimize")
def resume_optimize(data: ResumeOptimizeRequest):
    job_description = data.jobDescription or ""

    # Rule-based: extract missing keywords to guide the rewriter (fast, keyword-focused, no API cost)
    rule_ats = calculate_ats_score(data.resumeText, job_description)
    missing_keywords = rule_ats.get("missing_keywords", [])

    # Semantic: get the displayed "before" score — same model as the Scan tab for consistency
    if job_description.strip():
        original_ats = semantic_ats_score(data.resumeText, job_description)
    else:
        original_ats = rule_ats
    original_score = original_ats.get("ats_score", 0)

    # Rewrite the resume using Claude
    optimized_text = optimize_resume_text(
        data.resumeText,
        job_description,
        missing_keywords,
        original_score=original_score,
    )

    # Semantic: get the displayed "after" score — same model for apples-to-apples comparison
    if job_description.strip():
        improved_ats = semantic_ats_score(optimized_text, job_description)
    else:
        improved_ats = calculate_ats_score(optimized_text, job_description)
    improved_score = improved_ats.get("ats_score", 0)

    max_allowed = 15 if original_score < 60 else (12 if original_score < 75 else 10)

    # Only revert if score inflated unrealistically (anti-hallucination guard).
    # Flat or slight improvements still show Claude's rewrite — it's linguistically better
    # even when the score doesn't move.
    if improved_score - original_score > max_allowed:
        optimized_text = data.resumeText
        improved_ats = original_ats
        improved_score = original_score

    show_guidance = improved_score <= original_score

    return {
        "originalScore": original_score,
        "optimizedScore": improved_score,
        "scoreImprovement": improved_score - original_score,
        "originalResumeText": data.resumeText,
        "optimizedResumeText": optimized_text,
        "missingKeywordsBefore": missing_keywords,
        "missingKeywordsAfter": improved_ats.get("missing_keywords", []),
        "matchIntelligence": improved_ats.get("match_intelligence", {}),
        "optimizationGuidance": build_optimization_guidance(data.resumeText) if show_guidance else None,
    }


# =========================================================
# Cover Letter
# =========================================================

@app.post("/api/cover-letter/generate")
def cover_letter_generate(data: CoverLetterRequest):
    if not data.resumeText:
        raise HTTPException(status_code=400, detail="Resume text is required.")
    result = generate_cover_letter(
        resume_text=data.resumeText,
        job_description=data.jobDescription or "",
        company_name=data.companyName or "",
        candidate_name=data.candidateName or "",
    )
    if not result:
        raise HTTPException(status_code=500, detail="Cover letter generation failed.")
    return {"coverLetter": result}


# =========================================================
# LinkedIn
# =========================================================

@app.post("/api/linkedin/optimize")
def linkedin_optimize(data: LinkedInRequest):
    if not data.resumeText:
        raise HTTPException(status_code=400, detail="Resume text is required.")
    result = generate_linkedin_optimization(
        resume_text=data.resumeText,
        job_description=data.jobDescription or "",
        target_role=data.targetRole or "",
    )
    return {"headline": result.get("headline", ""), "summary": result.get("summary", "")}


# =========================================================
# Payments
# =========================================================

STRIPE_MONTHLY_PRICE_ID = os.getenv("STRIPE_MONTHLY_PRICE_ID", "price_monthly_placeholder")
STRIPE_ONETIME_PRICE_ID = os.getenv("STRIPE_ONETIME_PRICE_ID", "price_onetime_placeholder")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")


@app.post("/api/payments/create-checkout-session")
def create_checkout_session(plan: str = "monthly"):
    if not stripe.api_key:
        raise HTTPException(status_code=503, detail="Payment system not configured yet.")
    price_id = STRIPE_MONTHLY_PRICE_ID if plan == "monthly" else STRIPE_ONETIME_PRICE_ID
    try:
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[{"price": price_id, "quantity": 1}],
            mode="subscription" if plan == "monthly" else "payment",
            success_url=f"{FRONTEND_URL}/workspace?upgrade=success",
            cancel_url=f"{FRONTEND_URL}/pricing",
        )
        return {"url": session.url}
    except stripe.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/user/pro-status")
def pro_status():
    # FORCE_PRO=true in your .env lets you test pro features locally without Stripe.
    # Replace with a real Supabase subscription check when auth is wired.
    force_pro = os.getenv("FORCE_PRO", "").lower() in ("true", "1", "yes")
    return {"isPro": force_pro}
