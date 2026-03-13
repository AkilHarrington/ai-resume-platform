import json
import os
import re

from openai import OpenAI


OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4.1-mini")


def get_openai_client() -> OpenAI:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError(
            "OPENAI_API_KEY is missing. Set it in your environment or .env file."
        )

    return OpenAI(api_key=api_key)

def build_resume_text_optimization_prompt(
    resume_text,
    job_description,
    missing_keywords,
    original_score=0,
):

    # Adaptive keyword insertion limits based on resume strength
    if original_score < 60:
        keyword_limit = 3
    elif original_score < 75:
        keyword_limit = 5
    else:
        keyword_limit = 8

    limited_keywords = missing_keywords[:keyword_limit]

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
- Do NOT invent employers, titles, dates, degrees, certifications, industries, or responsibilities
- Preserve the candidate's current seniority and credibility level
- Never delete existing sections that already appear in the resume
- Keep the same general structure and section set as the original
- Do NOT transform a weak resume into a drastically more senior or more qualified resume
- Only strengthen wording and clarity where truthful
- Add only a LIMITED number of missing keywords naturally where appropriate
- Prefer subtle improvements over aggressive rewriting

OPTIMIZATION INTENSITY:
- Current ATS score: {original_score}
- If the current score is below 70, make conservative improvements only
- Do not insert all missing keywords
- Focus on the most relevant missing keywords first
- Use at most these keywords naturally where truthful:
{limited_keywords}

Resume:
{resume_text}

Target job description:
{job_description}

Return the complete optimized resume text only.
""".strip()


def optimize_resume_text(
    resume_text,
    job_description,
    missing_keywords,
    original_score=0,
):
    """
    Optimize raw resume text directly for the React frontend flow.
    Applies conservative guardrails to prevent unrealistic score jumps.
    """
    prompt = build_resume_text_optimization_prompt(
        resume_text,
        job_description,
        missing_keywords,
        original_score=original_score,
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

    if len(text_output) < max(120, int(len(resume_text) * 0.5)):
        return resume_text

    original_sections = {
        line.strip().lower()
        for line in resume_text.splitlines()
        if line.strip().lower() in {"summary", "skills", "experience", "education", "certifications"}
    }
    new_sections = {
        line.strip().lower()
        for line in text_output.splitlines()
        if line.strip().lower() in {"summary", "skills", "experience", "education", "certifications"}
    }

    if not original_sections.issubset(new_sections):
        return resume_text

    return text_output