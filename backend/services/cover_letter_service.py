# =========================================================
# File: services/cover_letter_service.py
# Purpose:
# Core AI service layer for cover letter generation.
#
# Responsibilities:
# - build the prompt for the OpenAI model
# - generate a professional, ATS-friendly cover letter
# - preserve the candidate's real background and seniority
#
# Key Notes:
# - this file should remain focused on cover letter generation only
# - do not mix resume optimization logic into this file
# - future Phase 2 improvements such as tone preservation and
#   anti-AI voice detection may also affect this service
# =========================================================

# =========================================================
# Imports and OpenAI Client Setup
# =========================================================

import os

from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4.1-mini")


def get_openai_client():
    """
    Create the OpenAI client lazily so the app does not fail at import time
    if the API key is missing.

    Required environment variable:
    - OPENAI_API_KEY
    """
    api_key = os.getenv("OPENAI_API_KEY")

    if not api_key:
        raise RuntimeError(
            "OPENAI_API_KEY is missing. Set it in your environment or .env file."
        )

    return OpenAI(api_key=api_key)


# =========================================================
# Prompt Builder
# =========================================================

def build_cover_letter_prompt(data):
    """
    Build the prompt used to generate the cover letter.

    Goal:
    - produce a polished, believable, ATS-friendly cover letter
    - preserve the candidate's actual experience and seniority
    - avoid fake company names, dates, and placeholders
    """
    return f"""
You are an expert executive cover letter writer.

Write a polished, professional, ATS-friendly cover letter tailored to the target role.

Return plain text only.

Rules:
- No markdown
- No bullet points
- No placeholders like [Company Name], [Date], [Address], etc.
- Do not invent employer names for the hiring company
- Use "Dear Hiring Manager," as the greeting
- Use the candidate's real name at the end
- Keep the tone confident, professional, and natural
- Keep length between 300 and 450 words
- Use 4 to 6 short paragraphs
- Include:
  1. Candidate name
  2. Location | email | phone on one line
  3. Greeting
  4. 3 to 4 body paragraphs
  5. Professional closing
- Do not include a fake date
- Do not include a fake company address
- Do not exaggerate unsupported achievements
- Preserve the candidate's seniority and years of experience faithfully
- If the input indicates 8 years, do not say 7 years
- If the input indicates 30 years, do not reduce it
- Prefer phrasing like "over 8 years" or "30 years of experience" only when clearly supported by the input
- Use the candidate's actual background, certifications, and role history from the input

Candidate Information:
Name: {data.name}
Email: {data.email}
Phone: {data.phone}
Location: {data.location}

Skills:
{data.skills}

Experience:
{data.experience}

Education:
{data.education}

Certifications:
{data.certifications}

Target Role / Job Description:
{data.job_description}

Output format example:

Jane Doe
Port of Spain, Trinidad and Tobago | jane@email.com | 868-000-0000

Dear Hiring Manager,

[paragraph 1]

[paragraph 2]

[paragraph 3]

Sincerely,
Jane Doe
""".strip()


# =========================================================
# Cover Letter Generation Logic
# =========================================================

def generate_cover_letter_content(data):
    """
    Generate a targeted cover letter from the candidate's input data.

    Flow:
    1. Build the prompt
    2. Send prompt to OpenAI
    3. Return clean plain-text cover letter output

    Notes:
    - frontend expects plain text from this service
    - frontend handles preview formatting separately
    """
    prompt = build_cover_letter_prompt(data)
    client = get_openai_client()

    response = client.responses.create(
        model=OPENAI_MODEL,
        input=prompt
    )

    return response.output[0].content[0].text.strip()