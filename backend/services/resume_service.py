# =========================================================
# File: services/resume_service.py
# Purpose:
# Core AI service layer for resume generation and optimization.
#
# Responsibilities:
# - build prompts for the OpenAI model
# - generate structured resume output
# - optimize resume content against a job description
# - preserve factual consistency while improving ATS alignment
#
# Key Notes:
# - this file is one of the most important product-quality files
# - prompt design strongly affects resume realism and ATS performance
# - future Phase 2 work such as controlled variation, tone preservation,
#   and anti-AI voice detection will likely be implemented here
# =========================================================

# =========================================================
# Imports and OpenAI Client Setup
# =========================================================

import json
import os

from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4.1-mini")


def get_openai_client():
    """
    Create the OpenAI client lazily so the app does not fail at import time
    if the environment variable is missing.

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
# Shared Parsing / Output Helpers
# =========================================================

def parse_json_response(text_output):
    """
    Parse the model's response into JSON.

    Notes:
    - The prompts explicitly instruct the model to return JSON only.
    - If the model ever returns invalid JSON, this function will raise and
      the calling route will fail visibly, which is useful during MVP testing.
    """
    return json.loads(text_output)


# =========================================================
# Prompt Builders
# =========================================================

def build_resume_prompt(data):
    """
    Build the main resume-generation prompt.

    Goal:
    - Convert raw user inputs into a structured, ATS-optimized resume JSON.
    - Preserve truthfulness while improving clarity and alignment to the target role.
    """
    return f"""
You are an expert executive resume writer and ATS optimization specialist.

Your task is to generate a highly ATS-compatible, professionally written resume in valid JSON format.

Return ONLY valid JSON in this exact structure:
{{
  "full_name": "string",
  "location": "string",
  "phone": "string",
  "email": "string",
  "professional_summary": "string",
  "skills": ["string", "string"],
  "professional_experience": [
    {{
      "company": "string",
      "title": "string",
      "description": ["string", "string", "string"]
    }}
  ],
  "education": ["string"],
  "certifications": ["string"]
}}

Hard Rules:
- Return JSON only
- No markdown
- No commentary
- No code fences
- No placeholder text
- No bracketed notes
- No missing-section commentary
- If a section has no data, return an empty list or empty string
- Use clear ATS-friendly wording
- Keep contact information simple and parseable
- Tailor the resume strongly to the target role
- Use role-relevant keywords naturally
- Use concise, achievement-oriented language
- Prefer measurable impact whenever possible
- Avoid generic filler language

Critical Experience Extraction Rules:
- Carefully extract every explicit employer name from the input and preserve it exactly when provided
- Carefully extract every explicit job title from the input and preserve it exactly when provided
- Preserve seniority words such as Senior, Lead, Principal, Manager, Director, Head, VP, Chief when they appear in the input
- Do not downgrade titles
- Do not replace known employers with blank values, "Confidential", "N/A", or invented names
- If the input clearly names a role but no company is given, keep the role and use a truthful generic company label only if absolutely necessary
- If the input clearly names both role and employer, preserve both exactly
- Prefer preserving the candidate's stated background over rewriting it into a weaker generic version
- Keep 4 to 6 bullets per role
- If a role is explicitly listed in the experience input, it must appear in the output

Professional Summary Rules:
- 3 to 5 lines in length
- Must include years of experience when available
- Must match the target role closely
- Must include 4 to 6 relevant keyword themes from the job description
- Should sound senior and credible, not generic

Skills Rules:
- Include 10 to 16 highly relevant ATS-friendly skills
- Prioritize the most important hard skills and leadership skills from the target role
- Remove duplicates
- Use short, standard phrasing

Professional Experience Rules:
- Include all provided roles when possible
- Each role must contain 4 to 6 bullet points
- If limited information is available, infer reasonable responsibilities based on the explicit role title and industry
- Each bullet must begin with a strong action verb
- Each bullet must contain responsibility + outcome or impact
- Prefer measurable impact where possible (percentages, budgets, revenue, assets, team size, scale, timelines)

Executive Role Guidance:
- Emphasize strategic leadership
- Mention scale indicators such as budgets, revenue, assets, geographic scope
- Highlight governance, capital allocation, transformation initiatives, and executive decision-making

Technical Role Guidance:
- Emphasize architecture, systems, scalability, reliability, performance, and team leadership

Operations Role Guidance:
- Emphasize process improvement, KPIs, cost reduction, compliance, efficiency gains, and operational scale

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
"""


def build_resume_optimization_prompt(existing_resume, job_description, missing_keywords):
    """
    Build the optimization prompt used to improve an already generated resume.

    Goal:
    - Keep the same facts
    - Improve ATS alignment
    - Add missing keywords naturally
    - Avoid making the resume sound fake or downgraded
    """
    keyword_text = ", ".join(missing_keywords) if missing_keywords else "None"

    return f"""
You are an expert ATS resume optimizer.

You will improve an EXISTING resume by making targeted edits only.

IMPORTANT:
You are editing an existing resume, not writing a brand-new one from scratch.

Return ONLY valid JSON in this exact structure:
{{
  "full_name": "string",
  "location": "string",
  "phone": "string",
  "email": "string",
  "professional_summary": "string",
  "skills": ["string", "string"],
  "professional_experience": [
    {{
      "company": "string",
      "title": "string",
      "description": ["string", "string", "string"]
    }}
  ],
  "education": ["string"],
  "certifications": ["string"]
}}

Rules:
- Return JSON only
- No markdown
- No commentary
- Preserve truthfulness and professionalism
- Do not add fake employers, degrees, or certifications
- Preserve original seniority and role level
- Preserve all known employer names exactly as given
- Preserve all known job titles exactly as given
- Do not downgrade titles
- Do not replace known employers with "Confidential", "N/A", or similar
- Do not simplify or weaken the candidate's existing experience
- Keep the same overall structure and facts unless a small wording improvement is needed
- Improve ATS alignment naturally
- Incorporate these missing keywords where appropriate: {keyword_text}
- Do not keyword-stuff
- Keep the resume targeted to the job description
- Keep 4 to 6 bullets per role
- Maintain quantified achievements wherever possible
- If the existing wording is already strong, make only minimal improvements
- The improved version should be equal or better in seniority, clarity, and ATS alignment than the original

Existing Resume JSON:
{json.dumps(existing_resume, ensure_ascii=False)}

Target Role / Job Description:
{job_description}
"""


# =========================================================
# Resume Generation Logic
# =========================================================

def generate_resume_content(data):
    """
    Generate a new structured resume from raw form input.

    Flow:
    1. Build the prompt
    2. Send to OpenAI
    3. Parse the JSON response
    4. Return structured resume data
    """
    prompt = build_resume_prompt(data)
    client = get_openai_client()

    response = client.responses.create(
        model=OPENAI_MODEL,
        input=prompt,
    )

    text_output = response.output[0].content[0].text
    return parse_json_response(text_output)


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
    4. Return improved structured resume data
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

    text_output = response.output[0].content[0].text
    return parse_json_response(text_output)