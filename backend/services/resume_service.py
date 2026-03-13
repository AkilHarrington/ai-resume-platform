# =========================================================
# File: services/resume_service.py
# Purpose:
# Resume generation and optimization logic for the AI Resume Platform.
#
# Responsibilities:
# - build AI prompts for resume generation and optimization
# - call OpenAI
# - parse JSON model output safely
# - return structured resume data
#
# Notes:
# - this version is aligned with the current React frontend
# - optimizer returns structured resume JSON
# - incomplete AI responses fall back safely to original data
# =========================================================

import json
import os
import re

from openai import OpenAI


# =========================================================
# Environment / Client
# =========================================================

OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4.1-mini")


def get_openai_client() -> OpenAI:
    """
    Create and return an OpenAI client.

    Raises:
        RuntimeError: if OPENAI_API_KEY is missing
    """
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError(
            "OPENAI_API_KEY is missing. Set it in your environment or .env file."
        )

    return OpenAI(api_key=api_key)


# =========================================================
# JSON Parsing Helpers
# =========================================================

def parse_json_response(text: str):
    """
    Parse a JSON object from a model response.

    Supports:
    - raw JSON
    - markdown fenced JSON blocks
    """
    if not text or not isinstance(text, str):
        return None

    cleaned = text.strip()

    # Remove fenced code block if present
    fenced_match = re.search(r"```(?:json)?\s*(.*?)\s*```", cleaned, re.DOTALL)
    if fenced_match:
        cleaned = fenced_match.group(1).strip()

    # First try direct JSON parse
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass

    # Fallback: extract first JSON object block
    start = cleaned.find("{")
    end = cleaned.rfind("}")
    if start != -1 and end != -1 and end > start:
        candidate = cleaned[start : end + 1]
        try:
            return json.loads(candidate)
        except json.JSONDecodeError:
            return None

    return None


# =========================================================
# Resume Generation Prompt
# =========================================================

def build_resume_generation_prompt(data) -> str:
    """
    Build a prompt for generating a structured resume from form data.
    """
    return f"""
You are a resume generation engine.

Create a professional structured resume from the candidate details below.

Return valid JSON only with this exact structure:

{{
  "full_name": "string",
  "email": "string",
  "phone": "string",
  "location": "string",
  "professional_summary": "string",
  "skills": ["string", "string"],
  "professional_experience": [
    {{
      "company": "string",
      "title": "string",
      "description": ["string", "string"]
    }}
  ],
  "education": ["string"],
  "certifications": ["string"]
}}

Candidate data:
Name: {getattr(data, "name", "")}
Email: {getattr(data, "email", "")}
Phone: {getattr(data, "phone", "")}
Location: {getattr(data, "location", "")}
Skills: {getattr(data, "skills", "")}
Experience: {getattr(data, "experience", "")}
Education: {getattr(data, "education", "")}
Certifications: {getattr(data, "certifications", "")}
Target job description: {getattr(data, "job_description", "")}

Return JSON only.
""".strip()


# =========================================================
# Resume Optimization Prompt
# =========================================================

def build_resume_optimization_prompt(existing_resume, job_description, missing_keywords):
    """
    Build a strict prompt for optimizing a structured resume while preserving
    all required sections and returning valid JSON only.
    """
    return f"""
You are a resume optimization engine.

Your task is to improve the ATS alignment of an EXISTING STRUCTURED RESUME against a target job description.

STRICT RULES:
- Return the FULL optimized resume as valid JSON only
- Do NOT return only a summary
- Do NOT return partial text
- Do NOT return markdown
- Do NOT return explanations
- Do NOT return commentary
- Do NOT omit sections
- Preserve the candidate's identity, employers, dates, and job titles
- Do NOT invent employers, dates, credentials, or promotions
- Improve wording naturally using the missing keywords where appropriate
- Keep the resume believable, professional, and ATS-friendly
- Preserve all major sections if they exist in the original resume

You must return JSON with this EXACT structure:

{{
  "full_name": "string",
  "email": "string",
  "phone": "string",
  "location": "string",
  "professional_summary": "string",
  "skills": ["string", "string"],
  "professional_experience": [
    {{
      "company": "string",
      "title": "string",
      "description": ["string", "string"]
    }}
  ],
  "education": ["string"],
  "certifications": ["string"]
}}

OPTIMIZATION GOALS:
- Improve ATS alignment with the target job description
- Naturally integrate these missing keywords where truthful and appropriate:
{missing_keywords}
- Strengthen the professional summary
- Strengthen experience bullets
- Strengthen skills if relevant
- Preserve the candidate's actual background and credibility
- Keep the tone professional and realistic

IMPORTANT:
- If a keyword cannot be added truthfully, do not force it
- Do not change the candidate's real role titles
- Do not remove experience entries
- Do not collapse the resume into one paragraph
- Return the complete optimized structured resume JSON only

Original structured resume:
{existing_resume}

Target job description:
{job_description}
""".strip()


# =========================================================
# Resume Generation Logic
# =========================================================

def generate_resume_content(data):
    """
    Generate a structured resume from candidate input.
    """
    prompt = build_resume_generation_prompt(data)
    client = get_openai_client()

    response = client.responses.create(
        model=OPENAI_MODEL,
        input=prompt,
    )

    try:
        text_output = response.output[0].content[0].text
    except (AttributeError, IndexError, KeyError, TypeError):
        return {
            "full_name": getattr(data, "name", ""),
            "email": getattr(data, "email", ""),
            "phone": getattr(data, "phone", ""),
            "location": getattr(data, "location", ""),
            "professional_summary": "",
            "skills": [],
            "professional_experience": [],
            "education": [],
            "certifications": [],
        }

    parsed = parse_json_response(text_output)
    if not isinstance(parsed, dict):
        return {
            "full_name": getattr(data, "name", ""),
            "email": getattr(data, "email", ""),
            "phone": getattr(data, "phone", ""),
            "location": getattr(data, "location", ""),
            "professional_summary": "",
            "skills": [],
            "professional_experience": [],
            "education": [],
            "certifications": [],
        }

    return {
        "full_name": parsed.get("full_name", getattr(data, "name", "")),
        "email": parsed.get("email", getattr(data, "email", "")),
        "phone": parsed.get("phone", getattr(data, "phone", "")),
        "location": parsed.get("location", getattr(data, "location", "")),
        "professional_summary": parsed.get("professional_summary", ""),
        "skills": parsed.get("skills", []),
        "professional_experience": parsed.get("professional_experience", []),
        "education": parsed.get("education", []),
        "certifications": parsed.get("certifications", []),
    }


# =========================================================
# Resume Optimization Logic
# =========================================================

def optimize_resume_content(existing_resume, job_description, missing_keywords):
    """
    Optimize an existing structured resume against a job description.

    Flow:
    1. Build the optimization prompt
    2. Send current resume + job description + missing keywords to OpenAI
    3. Parse the JSON response
    4. Validate that the response is complete enough
    5. Fall back to the original resume if the AI returns something partial or invalid
    """
    prompt = build_resume_optimization_prompt(
        existing_resume,
        job_description,
        missing_keywords,
    )
    client = get_openai_client()

    response = client.responses.create(
        model=OPENAI_MODEL,
        input=prompt,
    )

    # Safely extract text output
    try:
        text_output = response.output[0].content[0].text
    except (AttributeError, IndexError, KeyError, TypeError):
        return existing_resume

    optimized_resume = parse_json_response(text_output)

    # Safety fallback:
    # If parsing fails or the model returns an incomplete structure,
    # keep the original resume instead of returning a broken partial output.
    if not isinstance(optimized_resume, dict):
        return existing_resume

    # Core original fields
    original_summary = str(existing_resume.get("professional_summary", "")).strip()
    optimized_summary = str(optimized_resume.get("professional_summary", "")).strip()

    original_experience = existing_resume.get("professional_experience", [])
    optimized_experience = optimized_resume.get("professional_experience", [])

    original_skills = existing_resume.get("skills", [])
    optimized_skills = optimized_resume.get("skills", [])

    original_education = existing_resume.get("education", [])
    optimized_education = optimized_resume.get("education", [])

    original_certs = existing_resume.get("certifications", [])
    optimized_certs = optimized_resume.get("certifications", [])

    # Require a real summary
    if not optimized_summary:
        return existing_resume

    # If the model dropped sections that existed before, reject it
    if original_experience and not optimized_experience:
        return existing_resume

    if original_skills and not optimized_skills:
        return existing_resume

    if original_education and not optimized_education:
        return existing_resume

    if original_certs and not optimized_certs:
        return existing_resume

    # If the optimized summary is suspiciously tiny compared to the original,
    # treat it as incomplete.
    if original_summary and len(optimized_summary) < max(40, int(len(original_summary) * 0.4)):
        return existing_resume

    # If the model returned only a lightly structured summary rewrite and lost
    # the real resume body, reject it.
    original_total_content = (
        len(original_summary)
        + sum(len(str(item)) for item in original_skills)
        + sum(
            len(str(role.get("company", "")))
            + len(str(role.get("title", "")))
            + sum(len(str(bullet)) for bullet in role.get("description", []))
            for role in original_experience
        )
        + sum(len(str(item)) for item in original_education)
        + sum(len(str(item)) for item in original_certs)
    )

    optimized_total_content = (
        len(optimized_summary)
        + sum(len(str(item)) for item in optimized_skills)
        + sum(
            len(str(role.get("company", "")))
            + len(str(role.get("title", "")))
            + sum(len(str(bullet)) for bullet in role.get("description", []))
            for role in optimized_experience
        )
        + sum(len(str(item)) for item in optimized_education)
        + sum(len(str(item)) for item in optimized_certs)
    )

    if original_total_content > 0 and optimized_total_content < int(original_total_content * 0.5):
        return existing_resume

    # Normalize structure to preserve required keys even if the model omits some
    return {
        "full_name": optimized_resume.get("full_name", existing_resume.get("full_name", "")),
        "email": optimized_resume.get("email", existing_resume.get("email", "")),
        "phone": optimized_resume.get("phone", existing_resume.get("phone", "")),
        "location": optimized_resume.get("location", existing_resume.get("location", "")),
        "professional_summary": optimized_summary,
        "skills": optimized_skills if optimized_skills else original_skills,
        "professional_experience": (
            optimized_experience if optimized_experience else original_experience
        ),
        "education": optimized_education if optimized_education else original_education,
        "certifications": optimized_certs if optimized_certs else original_certs,
    }

def build_resume_text_optimization_prompt(resume_text, job_description, missing_keywords):
    return f"""
You are a resume optimization engine.

Rewrite the FULL resume text below to improve ATS alignment with the target job description.

RULES:
- Return the FULL optimized resume text
- Do NOT return JSON
- Do NOT return only a summary
- Do NOT return explanations
- Do NOT return markdown fences
- Preserve the candidate's real background
- Do NOT invent employers, titles, dates, degrees, or certifications
- Integrate these missing keywords naturally where truthful and appropriate:
{missing_keywords}
- Keep the resume professional, believable, and ATS-friendly
- Keep all major sections present if they exist

Resume:
{resume_text}

Target job description:
{job_description}

Return the complete optimized resume text only.
""".strip()


def optimize_resume_text(resume_text, job_description, missing_keywords):
    """
    Optimize raw resume text directly for the React frontend flow.
    """
    prompt = build_resume_text_optimization_prompt(
        resume_text,
        job_description,
        missing_keywords,
    )
    client = get_openai_client()

    response = client.responses.create(
        model=OPENAI_MODEL,
        input=prompt,
    )

    try:
        text_output = response.output[0].content[0].text.strip()
    except (AttributeError, IndexError, KeyError, TypeError):
        return resume_text

    if not text_output:
        return resume_text

    # Reject suspiciously tiny or partial outputs
    if len(text_output) < max(120, int(len(resume_text) * 0.5)):
        return resume_text

    return text_output