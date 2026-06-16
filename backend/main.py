# =========================================================
# File: main.py
# Purpose:
# FastAPI backend for AI Resume Studio.
# =========================================================

import io
import json
import logging
import os
import sys

import stripe
from fastapi import Request, Depends
from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from models.optimize_models import ResumeOptimizeRequest
from models.scan_models import ResumeScanRequest
from models.cover_letter_models import CoverLetterRequest
from models.linkedin_models import LinkedInRequest
from services.ats_service import calculate_ats_score
from services.semantic_ats_service import semantic_ats_score
from fastapi.responses import StreamingResponse
from services.resume_service import (
    stream_resume_optimization,
    generate_cover_letter,
    generate_linkedin_optimization,
    stream_cover_letter,
    stream_linkedin_optimization,
)
from services.pdf_service import generate_resume_pdf, generate_cover_letter_pdf
from services.resume_parser import parse_resume_text
from services.supabase_service import (
    get_user_by_email,
    set_user_pro,
    revoke_user_pro,
    log_scan_result,
    verify_token,
    get_user_pro_status,
)
from services.exceptions import AIUnavailableError

load_dotenv()

# =========================================================
# Logging — structured, leveled, named
# =========================================================

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)
logger = logging.getLogger("ai_resume_studio")

# =========================================================
# Safety guard — refuse to start if FORCE_PRO is on in production
# =========================================================

ENVIRONMENT = os.getenv("ENVIRONMENT", "development").lower()
FORCE_PRO = os.getenv("FORCE_PRO", "").lower() in ("true", "1", "yes")

if ENVIRONMENT == "production" and FORCE_PRO:
    logger.critical(
        "FORCE_PRO=true is set in a production environment. "
        "This would give every user free Pro access. "
        "Set FORCE_PRO=false and restart."
    )
    sys.exit(1)

# =========================================================
# Startup env var validation — fail loudly, not silently
# =========================================================

REQUIRED_ENV_VARS = [
    "ANTHROPIC_API_KEY",
    "SUPABASE_URL",
    "SUPABASE_SERVICE_KEY",
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "STRIPE_MONTHLY_PRICE_ID",
    "STRIPE_ONETIME_PRICE_ID",
]

_PLACEHOLDER_SUFFIXES = ("_placeholder", "your_key_here", "changeme")

if ENVIRONMENT == "production":
    _missing = []
    for _var in REQUIRED_ENV_VARS:
        _val = os.getenv(_var, "")
        if not _val or any(_val.endswith(s) for s in _PLACEHOLDER_SUFFIXES):
            _missing.append(_var)
    if _missing:
        for _var in _missing:
            logger.critical("Required env var %s is missing or still set to placeholder.", _var)
        sys.exit(1)

stripe.api_key = os.getenv("STRIPE_SECRET_KEY", "")

# =========================================================
# Rate limiter
# =========================================================

# Rate limit by authenticated user ID for protected routes, fall back to IP for public ones.
def _user_or_ip_key(request: Request) -> str:
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        token = auth.removeprefix("Bearer ").strip()
        user = verify_token(token)
        if user:
            return f"user:{user['id']}"
    return get_remote_address(request)

limiter = Limiter(key_func=_user_or_ip_key)

# =========================================================
# App
# =========================================================

app = FastAPI(title="AI Resume Studio API", version="3.0.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


@app.exception_handler(AIUnavailableError)
async def ai_unavailable_handler(request: Request, exc: AIUnavailableError):
    from fastapi.responses import JSONResponse
    return JSONResponse(status_code=503, content={"detail": str(exc)})


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
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)


# =========================================================
# Security headers middleware
# =========================================================

@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    # Content-Security-Policy — backend API only serves JSON/PDF; block everything else
    response.headers["Content-Security-Policy"] = "default-src 'none'; frame-ancestors 'none'"
    # Permissions Policy — disable browser features the API never uses
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    # HSTS — only on HTTPS (production); omit in dev so browsers don't cache it
    if ENVIRONMENT == "production":
        response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains"
    return response


# =========================================================
# Auth helpers — sync: FastAPI runs these in a thread pool
# =========================================================

def get_current_user(request: Request) -> dict:
    """Verify the Supabase JWT from Authorization header. Returns {id, email} or raises 401."""
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header.")
    token = auth_header.removeprefix("Bearer ").strip()
    user = verify_token(token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired session. Please sign in again.")
    return user


def require_pro(user: dict = Depends(get_current_user)) -> dict:
    """Require auth + active Pro subscription. FORCE_PRO bypasses in dev."""
    if FORCE_PRO:
        return user
    try:
        is_pro = get_user_pro_status(user["id"])
    except Exception as e:
        # Supabase connectivity failure — don't silently demote paying users.
        # Return 503 so they know it's a service issue, not their account.
        logger.error("get_user_pro_status failed for user %s: %s", user.get("id"), type(e).__name__)
        raise HTTPException(status_code=503, detail="Unable to verify subscription status. Please try again in a moment.")
    if not is_pro:
        raise HTTPException(status_code=403, detail="This feature requires a Pro plan.")
    return user


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
        # Magic bytes check — real PDFs start with %PDF-
        if not content.startswith(b"%PDF-"):
            raise HTTPException(status_code=422, detail="File does not appear to be a valid PDF.")
        try:
            import pdfplumber
            import re as _re
            with pdfplumber.open(io.BytesIO(content)) as pdf:
                text = "\n".join(page.extract_text() or "" for page in pdf.pages).strip()
            text = _re.sub(r'\(cid:\d+\)', '•', text)
            return text
        except Exception as exc:
            logger.warning("pdfplumber failed to parse upload: %s", exc)
            raise HTTPException(status_code=422, detail="Could not extract text from PDF.")

    if filename.endswith(".docx"):
        # Magic bytes check — DOCX files are ZIP archives, always start with PK\x03\x04
        if not content.startswith(b"PK\x03\x04"):
            raise HTTPException(status_code=422, detail="File does not appear to be a valid DOCX.")
        try:
            import docx
            doc = docx.Document(io.BytesIO(content))
            return "\n".join(p.text for p in doc.paragraphs if p.text.strip()).strip()
        except Exception as exc:
            logger.warning("python-docx failed to parse upload: %s", exc)
            raise HTTPException(status_code=422, detail="Could not extract text from DOCX.")

    try:
        return content.decode("utf-8").strip()
    except Exception:
        raise HTTPException(status_code=422, detail="Unsupported file format. Please upload PDF, DOCX, or plain text.")


# =========================================================
# Health — verifies env vars, not just process liveness
# =========================================================

@app.get("/")
def root():
    return {"message": "AI Resume Studio API", "version": "3.0.0"}


@app.get("/health")
def health():
    issues = []
    if not os.getenv("ANTHROPIC_API_KEY"):
        issues.append("ANTHROPIC_API_KEY missing")
    if not os.getenv("SUPABASE_URL"):
        issues.append("SUPABASE_URL missing")
    if not os.getenv("SUPABASE_SERVICE_KEY"):
        issues.append("SUPABASE_SERVICE_KEY missing")
    if not os.getenv("STRIPE_WEBHOOK_SECRET"):
        issues.append("STRIPE_WEBHOOK_SECRET missing")
    if issues:
        return {"status": "degraded", "issues": issues}
    return {"status": "ok"}


# =========================================================
# Resume Upload — sync def: runs in FastAPI's thread pool
# =========================================================

@app.post("/api/resume/upload")
@limiter.limit("20/minute")
def resume_upload(request: Request, file: UploadFile = File(...), user: dict = Depends(get_current_user)):
    resume_text = extract_text_from_upload(file)
    if not resume_text:
        raise HTTPException(status_code=422, detail="No text could be extracted from the file.")
    parsed = parse_resume_text(resume_text)
    return {"resumeText": resume_text, "parsedResume": parsed}


# =========================================================
# ATS Scan — sync def: runs in FastAPI's thread pool
# =========================================================

@app.post("/api/resume/scan")
@limiter.limit("10/minute")
def resume_scan(request: Request, data: ResumeScanRequest, user: dict = Depends(get_current_user)):
    job_description = data.jobDescription or ""

    if not job_description.strip():
        return {
            "overallScore": None,
            "summary": "Add a job description to get your ATS score.",
            "previewText": data.resumeText,
            "parsedResume": {},
            "matchedKeywords": [],
            "missingKeywords": [],
            "categoryScores": [],
            "matchIntelligence": {},
            "strengths": [],
            "gaps": [],
            "recruiterVerdict": "",
            "semantic": True,
            "noJd": True,
            "issues": [],
            "recommendations": [],
        }

    ats = semantic_ats_score(data.resumeText, job_description)

    matched = ats.get("matched_keywords", [])
    missing = ats.get("missing_keywords", [])
    score = ats.get("ats_score", 0)

    log_scan_result(
        user_id=user["id"],
        scan_type="scan",
        before_score=score,
        after_score=score,
        missing_keywords=missing,
        matched_keywords=matched,
        semantic=ats.get("semantic", False),
    )

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
# Resume Optimize — streaming SSE (async required for StreamingResponse)
# Events: status → token (many) → result → done  |  error on failure
# =========================================================

@app.post("/api/resume/optimize/stream")
@limiter.limit("5/minute")
async def resume_optimize_stream(request: Request, data: ResumeOptimizeRequest, user: dict = Depends(require_pro)):
    def generate():
        try:
            job_description = data.jobDescription or ""

            # ── Step 1: keyword extraction ────────────────────────────────────
            # Reuse scan-tab keywords when available — skips the rule-based pass entirely.
            if data.existingKeywords is not None:
                missing_keywords = data.existingKeywords
                rule_ats = {"missing_keywords": missing_keywords, "matched_keywords": [], "ats_score": 0}
            else:
                yield f"data: {json.dumps({'type': 'status', 'message': 'Analyzing keywords…'})}\n\n"
                rule_ats = calculate_ats_score(data.resumeText, job_description)
                missing_keywords = rule_ats.get("missing_keywords", [])

            # ── Step 2: original score ────────────────────────────────────────
            # Reuse scan-tab score when available — skips the Haiku call entirely.
            if data.existingScore and data.existingScore > 0:
                original_score = data.existingScore
                original_ats = {**rule_ats, "ats_score": original_score}
            else:
                yield f"data: {json.dumps({'type': 'status', 'message': 'Scoring your resume…'})}\n\n"
                if job_description.strip():
                    original_ats = semantic_ats_score(data.resumeText, job_description)
                else:
                    original_ats = rule_ats
                original_score = original_ats.get("ats_score", 0)

            # ── Step 3: stream the rewrite (Sonnet, first token in ~1-2s) ────
            yield f"data: {json.dumps({'type': 'status', 'message': 'Rewriting your resume…'})}\n\n"
            optimized_text = ""
            for chunk in stream_resume_optimization(
                data.resumeText, job_description, missing_keywords, original_score
            ):
                optimized_text += chunk
                yield f"data: {json.dumps({'type': 'token', 'text': chunk})}\n\n"

            # ── Validate assembled text ───────────────────────────────────────
            optimized_text = optimized_text.strip()
            if not optimized_text:
                yield f"data: {json.dumps({'type': 'error', 'message': 'Claude returned an empty response. Please try again.'})}\n\n"
                return
            if len(optimized_text) < max(120, int(len(data.resumeText) * 0.5)):
                yield f"data: {json.dumps({'type': 'error', 'message': 'The optimized resume was unexpectedly short. Please try again.'})}\n\n"
                return

            # ── Step 4: re-score (Haiku, ~2s) ────────────────────────────────
            yield f"data: {json.dumps({'type': 'status', 'message': 'Scoring your improvements…'})}\n\n"
            if job_description.strip():
                improved_ats = semantic_ats_score(optimized_text, job_description)
                if improved_ats.get("ats_score", 0) == 0 and original_score > 0:
                    # Score of 0 likely means a parse/transport failure — fall through
                    # to keyword-diff fallback rather than wasting a duplicate call.
                    logger.warning("Re-score returned 0 — falling through to keyword-diff fallback.")
            else:
                improved_ats = calculate_ats_score(optimized_text, job_description)
            improved_score = improved_ats.get("ats_score", 0)

            # Fallback: estimate from keyword diff when both semantic attempts fail
            scorer_failed = improved_score == 0 and original_score > 0
            if scorer_failed:
                logger.warning("Semantic re-score failed twice — estimating from keyword diff.")
                rule_improved = calculate_ats_score(optimized_text, job_description)
                rule_before = rule_ats.get("ats_score", 0)
                rule_after = rule_improved.get("ats_score", 0)
                if rule_before > 0 and rule_after > rule_before:
                    keyword_gain = (rule_after - rule_before) / 100.0
                    estimated_gain = max(1, min(round(original_score * keyword_gain * 0.5), 10))
                    improved_score = original_score + estimated_gain
                    improved_ats = {**original_ats, "ats_score": improved_score,
                                    "matched_keywords": rule_improved.get("matched_keywords", []),
                                    "missing_keywords": rule_improved.get("missing_keywords", [])}
                else:
                    improved_score = original_score
                    improved_ats = {**original_ats, "ats_score": improved_score}

            # Cap credibility ceiling
            max_allowed = 15 if original_score < 75 else 12
            if not scorer_failed and improved_score - original_score > max_allowed:
                improved_score = original_score + max_allowed
                improved_ats = {**improved_ats, "ats_score": improved_score}

            show_guidance = improved_score <= original_score

            log_scan_result(
                user_id=user["id"],
                scan_type="optimize",
                before_score=original_score,
                after_score=improved_score,
                missing_keywords=missing_keywords,
                matched_keywords=improved_ats.get("matched_keywords", []),
                semantic=True,
            )

            # ── Step 5: final result event ────────────────────────────────────
            result_payload = {
                "type": "result",
                "originalScore": original_score,
                "optimizedScore": improved_score,
                "scoreImprovement": improved_score - original_score,
                "originalResumeText": data.resumeText,
                "optimizedResumeText": optimized_text,
                "missingKeywordsBefore": missing_keywords,
                "missingKeywordsAfter": improved_ats.get("missing_keywords", []),
                "matchIntelligence": improved_ats.get("match_intelligence", {}),
                "optimizationGuidance": build_optimization_guidance(data.resumeText) if show_guidance else None,
                "optimizedCategoryScores": improved_ats.get("category_scores", []),
            }
            yield f"data: {json.dumps(result_payload)}\n\n"
            yield 'data: {"type": "done"}\n\n'

        except AIUnavailableError as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
        except Exception as e:
            logger.error("optimize/stream unexpected error: %s: %s", type(e).__name__, e)
            yield f"data: {json.dumps({'type': 'error', 'message': 'Optimization failed. Please try again.'})}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


# =========================================================
# Cover Letter — sync def
# =========================================================

@app.post("/api/cover-letter/generate")
@limiter.limit("5/minute")
def cover_letter_generate(request: Request, data: CoverLetterRequest, user: dict = Depends(require_pro)):
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
# Cover Letter — streaming (async required for StreamingResponse)
# =========================================================

@app.post("/api/cover-letter/stream")
@limiter.limit("5/minute")
async def cover_letter_stream(request: Request, data: CoverLetterRequest, user: dict = Depends(require_pro)):
    def generate():
        try:
            for chunk in stream_cover_letter(
                data.resumeText,
                data.jobDescription or "",
                data.companyName or "",
                data.candidateName or "",
            ):
                yield f"data: {json.dumps({'chunk': chunk})}\n\n"
            yield "data: [DONE]\n\n"
        except AIUnavailableError as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


# =========================================================
# LinkedIn — sync def
# =========================================================

@app.post("/api/linkedin/optimize")
@limiter.limit("5/minute")
def linkedin_optimize(request: Request, data: LinkedInRequest, user: dict = Depends(require_pro)):
    if not data.resumeText:
        raise HTTPException(status_code=400, detail="Resume text is required.")
    result = generate_linkedin_optimization(
        resume_text=data.resumeText,
        job_description=data.jobDescription or "",
        target_role=data.targetRole or "",
    )
    return {"headline": result.get("headline", ""), "summary": result.get("summary", "")}


# =========================================================
# LinkedIn — streaming (async required for StreamingResponse)
# =========================================================

@app.post("/api/linkedin/stream")
@limiter.limit("5/minute")
async def linkedin_stream(request: Request, data: LinkedInRequest, user: dict = Depends(require_pro)):
    def generate():
        try:
            for chunk in stream_linkedin_optimization(
                data.resumeText,
                data.jobDescription or "",
                data.targetRole or "",
            ):
                yield f"data: {json.dumps({'chunk': chunk})}\n\n"
            yield "data: [DONE]\n\n"
        except AIUnavailableError as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


# =========================================================
# PDF Download — Resume (Pro) + Cover Letter (Pro)
# sync def: PDF generation is CPU-bound, runs in thread pool
# =========================================================

from fastapi.responses import Response as FastAPIResponse
from pydantic import BaseModel

class ResumePdfRequest(BaseModel):
    resumeText: str
    template: str = "professional"

class CoverLetterPdfRequest(BaseModel):
    coverLetterText: str
    companyName: str = ""


@app.post("/api/resume/download-pdf")
@limiter.limit("10/minute")
def resume_download_pdf(request: Request, data: ResumePdfRequest, user: dict = Depends(require_pro)):
    if not data.resumeText.strip():
        raise HTTPException(status_code=400, detail="Resume text is required.")
    template = data.template.lower().strip()
    if template not in ("professional", "modern", "executive"):
        template = "professional"
    resume_data = parse_resume_text(data.resumeText)
    try:
        pdf_bytes = generate_resume_pdf(resume_data, template)
    except Exception as e:
        logger.error("PDF generation failed: %s", e)
        raise HTTPException(status_code=500, detail="PDF generation failed. Please try again.")
    filename = f"resume-{template}.pdf"
    return FastAPIResponse(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@app.post("/api/cover-letter/download-pdf")
@limiter.limit("10/minute")
def cover_letter_download_pdf(request: Request, data: CoverLetterPdfRequest, user: dict = Depends(require_pro)):
    if not data.coverLetterText.strip():
        raise HTTPException(status_code=400, detail="Cover letter text is required.")
    try:
        pdf_bytes = generate_cover_letter_pdf(data.coverLetterText, data.companyName)
    except Exception as e:
        logger.error("Cover letter PDF generation failed: %s", e)
        raise HTTPException(status_code=500, detail="PDF generation failed. Please try again.")
    import re as _re
    raw_slug = data.companyName.lower().replace(" ", "-") if data.companyName else "cover-letter"
    slug = _re.sub(r"[^a-z0-9\-]", "", raw_slug)[:60] or "cover-letter"
    filename = f"cover-letter-{slug}.pdf"
    return FastAPIResponse(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


# =========================================================
# Payments
# =========================================================

STRIPE_MONTHLY_PRICE_ID = os.getenv("STRIPE_MONTHLY_PRICE_ID", "price_monthly_placeholder")
STRIPE_ONETIME_PRICE_ID = os.getenv("STRIPE_ONETIME_PRICE_ID", "price_onetime_placeholder")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")


@app.post("/api/payments/create-checkout-session")
@limiter.limit("10/minute")
def create_checkout_session(request: Request, plan: str = "monthly", user: dict = Depends(get_current_user)):
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
            customer_email=user.get("email"),
        )
        return {"url": session.url}
    except stripe.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/user/pro-status")
@limiter.limit("30/minute")
def pro_status(request: Request, user: dict = Depends(get_current_user)):
    if FORCE_PRO:
        return {"isPro": True}
    try:
        return {"isPro": get_user_pro_status(user["id"])}
    except Exception as e:
        logger.error("pro_status check failed for user %s: %s", user.get("id"), type(e).__name__)
        raise HTTPException(status_code=503, detail="Unable to verify subscription status. Please try again in a moment.")


# =========================================================
# Stripe Webhook — async required for await request.body()
# =========================================================

STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "")


@app.post("/api/payments/webhook")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature", "")

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, STRIPE_WEBHOOK_SECRET)
    except stripe.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid Stripe signature.")
    except Exception as e:
        # Log detail internally; return generic message to untrusted caller
        logger.error("Stripe webhook parse error: %s", type(e).__name__)
        raise HTTPException(status_code=400, detail="Webhook processing failed.")

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        customer_email = session.get("customer_details", {}).get("email", "")
        customer_id = session.get("customer", "")
        subscription_id = session.get("subscription", "") or ""

        if customer_email:
            user = get_user_by_email(customer_email)
            if user:
                set_user_pro(
                    user_id=user["id"],
                    stripe_customer_id=customer_id,
                    stripe_subscription_id=subscription_id,
                )
                logger.info("Pro access granted for %s", customer_email)
            else:
                logger.warning("checkout.session.completed: no profile found for %s", customer_email)

    elif event["type"] == "customer.subscription.deleted":
        subscription = event["data"]["object"]
        customer_id = subscription.get("customer", "")
        if customer_id:
            try:
                revoke_user_pro(stripe_customer_id=customer_id)
                logger.info("Pro access revoked for Stripe customer %s", customer_id)
            except Exception as e:
                # Log the failure — this must not silently pass. Alert and investigate.
                logger.error(
                    "CRITICAL: Failed to revoke Pro for Stripe customer %s: %s",
                    customer_id, e
                )
                # Still return 200 so Stripe doesn't retry infinitely,
                # but the error is now visible in logs for manual remediation.

    return {"received": True}
