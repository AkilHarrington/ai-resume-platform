# =========================================================
# File: models/resume_models.py
# Purpose:
# Define the request schema used by the FastAPI backend.
#
# Responsibilities:
# - validate incoming frontend data
# - enforce a consistent structure for resume requests
# - ensure required fields exist before reaching service logic
#
# Key Notes:
# - this model is used by multiple API routes:
#     /generate-resume
#     /optimize-resume
#     /ats-score
#     /generate-cover-letter
#     /generate-resume-docx
#     /generate-resume-pdf
#
# - FastAPI automatically validates incoming JSON against this schema
# - default values allow partial submissions during testing
# =========================================================


# =========================================================
# Imports
# =========================================================

from pydantic import BaseModel


# =========================================================
# Resume Request Model
# =========================================================

class ResumeRequest(BaseModel):
    """
    Data model representing the payload sent from the frontend.

    The frontend sends this structure when the user submits
    the resume generation form.

    Fields correspond directly to the form inputs in index.html.
    """

    # Candidate identity
    name: str
    email: str

    # Optional contact fields
    phone: str = ""
    location: str = ""

    # Resume content inputs
    skills: str = ""
    experience: str = ""
    education: str = ""
    certifications: str = ""

    # Target job description for ATS analysis
    job_description: str = ""

    # Resume template selection
    # Possible values used by the frontend:
    # - professional
    # - modern
    # - executive
    template: str = "professional"