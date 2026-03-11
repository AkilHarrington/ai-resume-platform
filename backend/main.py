# =========================================================
# File: main.py
# Purpose:
# FastAPI backend entry point for the AI Resume Platform.
#
# Responsibilities:
# - define API routes
# - receive frontend requests
# - orchestrate resume generation and optimization
# - create Stripe checkout sessions
# - return JSON and file responses
#
# Key Notes:
# - this file should remain focused on routing/orchestration
# - heavy AI/business logic should stay in service files
# - frontend depends on stable response structures from these routes
# - payment flow is currently MVP-level and uses frontend Pro unlock
# =========================================================

# =========================================================
# Imports and Environment Setup
# =========================================================

import os

import stripe
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse

from models.resume_models import ResumeRequest
from services.ats_service import calculate_ats_score
from services.cover_letter_docx_service import create_cover_letter_docx
from services.cover_letter_service import generate_cover_letter_content
from services.docx_service import create_resume_docx
from services.pdf_service import create_resume_pdf
from services.resume_service import generate_resume_content, optimize_resume_content

load_dotenv()

# Stripe secret key should be provided through environment variables.
# Example:
# export STRIPE_SECRET_KEY="sk_test_..."
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")


# =========================================================
# FastAPI App Initialization
# =========================================================

app = FastAPI(
    title="AI Resume Platform API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5500",
        "http://localhost:5500",
        "null",
        "https://ai-resume-platform-1-da6p.onrender.com",
        "https://ai-resume-platform-eluf.onrender.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# Health Check Routes
# =========================================================

@app.get("/")
def root():
    """
    Basic health check route used to confirm the backend is running.
    """
    return {"message": "AI Resume Platform backend is running"}


# =========================================================
# Resume Generation Routes
# =========================================================

@app.post("/generate-resume")
def generate_resume(data: ResumeRequest):
    """
    Generate a structured resume from the user's submitted form data.

    Frontend use:
    - Can be used for basic resume generation if needed.
    - Current main preview flow primarily uses /ats-score instead.
    """
    resume_data = generate_resume_content(data)

    return {
        "message": "Resume generated",
        "resume": resume_data,
    }


@app.post("/generate-resume-docx")
def generate_resume_docx(data: ResumeRequest):
    """
    Generate a DOCX file version of the resume.

    Flow:
    1. Generate structured resume content
    2. Pass structured content into DOCX export service
    3. Return downloadable file
    """
    resume_data = generate_resume_content(data)
    file_path = create_resume_docx(resume_data, data.template)

    return FileResponse(
        path=file_path,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        filename="resume.docx",
    )


@app.post("/generate-resume-pdf")
def generate_resume_pdf(data: ResumeRequest):
    """
    Generate a PDF file version of the resume.

    Flow:
    1. Generate structured resume content
    2. Pass structured content into PDF export service
    3. Return downloadable file
    """
    resume_data = generate_resume_content(data)
    file_path = create_resume_pdf(resume_data, data.template)

    return FileResponse(
        path=file_path,
        media_type="application/pdf",
        filename="resume.pdf",
    )


# =========================================================
# ATS Analysis Routes
# =========================================================

@app.post("/ats-score")
def ats_score(data: ResumeRequest):
    """
    Generate the resume preview and calculate ATS alignment.

    This is one of the most important frontend routes because it powers:
    - resume preview
    - ATS score
    - matched keywords
    - missing keywords
    """
    resume = generate_resume_content(data)
    ats = calculate_ats_score(resume, data.job_description)

    return {
        "resume": resume,
        "ats_analysis": ats,
    }


# =========================================================
# Resume Optimization Routes
# =========================================================

@app.post("/optimize-resume")
def optimize_resume(data: ResumeRequest):
    """
    Optimize the generated resume against the target job description.

    Flow:
    1. Generate the initial structured resume
    2. Calculate the initial ATS score
    3. Optimize the resume using missing keywords and JD alignment
    4. Recalculate ATS on the improved resume
    5. Safety check:
       If the optimized version somehow scores worse, keep the original

    This route powers:
    - score improvement panel
    - before/after comparison
    - rewrite explanations
    - advanced ATS insights
    """
    initial_resume = generate_resume_content(data)
    initial_ats = calculate_ats_score(initial_resume, data.job_description)

    improved_resume = optimize_resume_content(
        initial_resume,
        data.job_description,
        initial_ats["missing_keywords"],
    )
    improved_ats = calculate_ats_score(improved_resume, data.job_description)

    # Defensive fallback:
    # Never return a worse optimized version than the original.
    if improved_ats["ats_score"] < initial_ats["ats_score"]:
        improved_resume = initial_resume
        improved_ats = initial_ats

    return {
        "original_resume": initial_resume,
        "original_ats_analysis": initial_ats,
        "improved_resume": improved_resume,
        "improved_ats_analysis": improved_ats,
    }


# =========================================================
# Cover Letter Routes
# =========================================================

@app.post("/generate-cover-letter")
def generate_cover_letter(data: ResumeRequest):
    """
    Generate a targeted cover letter based on user input and job description.
    """
    cover_letter = generate_cover_letter_content(data)

    return {
        "message": "Cover letter generated",
        "cover_letter": cover_letter,
    }


@app.post("/generate-cover-letter-docx")
def generate_cover_letter_docx(data: ResumeRequest):
    """
    Generate a DOCX export of the cover letter.
    """
    cover_letter = generate_cover_letter_content(data)
    file_path = create_cover_letter_docx(data.name, cover_letter)

    return FileResponse(
        path=file_path,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        filename="cover_letter.docx",
    )


# =========================================================
# Stripe Payment Routes
# =========================================================

@app.post("/create-checkout-session")
async def create_checkout_session():
    """
    Create a Stripe Checkout session for the Pro package.

    Current MVP behavior:
    - Stripe redirects to success.html after payment
    - success.html sets Pro access in localStorage on the frontend

    Important:
    - success_url and cancel_url are currently set for local development
    - update them for production deployment
    """
    try:
        if not stripe.api_key:
            return JSONResponse(
                {"error": "Missing STRIPE_SECRET_KEY environment variable."},
                status_code=500,
            )

        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            mode="payment",
            line_items=[
                {
                    "price_data": {
                        "currency": "usd",
                        "product_data": {
                            "name": "AI Resume Studio Pro Package",
                        },
                        "unit_amount": 2900,  # $29.00 USD
                    },
                    "quantity": 1,
                }
            ],
            success_url="http://localhost:5500/success.html",
            cancel_url="http://localhost:5500/index.html",
        )

        return JSONResponse({"url": session.url})

    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)