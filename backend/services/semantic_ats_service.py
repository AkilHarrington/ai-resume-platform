# =========================================================
# File: services/semantic_ats_service.py
# Purpose:
# Claude-powered semantic ATS scorer.
# Replaces rule-based keyword counting with genuine AI
# evaluation across 5 hiring dimensions.
# =========================================================

import json
import os
import re

import anthropic

from services.exceptions import AIUnavailableError


CLAUDE_MODEL = os.getenv("CLAUDE_MODEL", "claude-sonnet-4-6")

DIMENSION_WEIGHTS = {
    "keyword_alignment":      0.30,  # reduced from 35% to make room for human_readability
    "experience_relevance":   0.25,
    "seniority_match":        0.15,
    "achievement_quality":    0.15,
    "education_credentials":  0.10,
    "human_readability":      0.05,  # does this read well to a human recruiter?
}


def get_client() -> anthropic.Anthropic:
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        raise RuntimeError("ANTHROPIC_API_KEY is not set.")
    return anthropic.Anthropic(api_key=api_key)


def build_scoring_prompt(resume_text: str, job_description: str) -> str:
    return f"""You are a senior recruiter and ATS expert evaluating resume-to-job fit.

Analyze the resume against the job description across 6 dimensions.
Be accurate and realistic — do not inflate scores. A score of 70 is good, 85+ is excellent.

DIMENSIONS (score each 0–100):
- keyword_alignment: Semantic match of resume skills/terms to JD requirements (not just literal words)
- experience_relevance: How relevant the candidate's actual experience is to this specific role
- seniority_match: Whether the candidate's level matches the role's seniority expectations
- achievement_quality: Quality of accomplishments — quantified results, scope, impact statements
- education_credentials: How well education and certifications match what the JD asks for
- human_readability: Would a human recruiter find this resume clear, compelling, and easy to read?
  Score low if: generic buzzwords dominate, bullets are vague, writing sounds robotic or AI-generated.
  Score high if: writing is specific, varied, authentic, and tells a clear career story.

Return ONLY valid JSON — no markdown, no explanation, no code fences:

{{
  "overall_score": <integer 0-100, weighted by: keyword_alignment 30%, experience_relevance 25%, seniority_match 15%, achievement_quality 15%, education_credentials 10%, human_readability 5%>,
  "dimensions": {{
    "keyword_alignment":    {{"score": <0-100>, "reasoning": "<1-2 concise sentences>"}},
    "experience_relevance": {{"score": <0-100>, "reasoning": "<1-2 concise sentences>"}},
    "seniority_match":      {{"score": <0-100>, "reasoning": "<1-2 concise sentences>"}},
    "achievement_quality":  {{"score": <0-100>, "reasoning": "<1-2 concise sentences>"}},
    "education_credentials":{{"score": <0-100>, "reasoning": "<1-2 concise sentences>"}},
    "human_readability":    {{"score": <0-100>, "reasoning": "<1-2 concise sentences>"}}
  }},
  "matched_skills": ["<skill>", ...],
  "missing_skills": ["<skill>", ...],
  "strengths": ["<strength>", "<strength>", "<strength>"],
  "gaps": ["<gap>", "<gap>", "<gap>"],
  "recruiter_verdict": "<2-3 sentence plain-English assessment a recruiter would give this candidate>"
}}

Resume:
{resume_text}

Job Description:
{job_description}"""


def calculate_weighted_score(dimensions: dict) -> int:
    total = 0.0
    for key, weight in DIMENSION_WEIGHTS.items():
        score = dimensions.get(key, {}).get("score", 0)
        total += score * weight
    return round(total)


def semantic_ats_score(resume_text: str, job_description: str) -> dict:
    """
    Score a resume against a job description using Claude.
    Falls back to a minimal structured response if the API call fails.
    """
    if not job_description.strip():
        return _no_jd_response()

    client = get_client()
    prompt = build_scoring_prompt(resume_text, job_description)

    try:
        response = client.messages.create(
            model=CLAUDE_MODEL,
            max_tokens=1024,
            messages=[{"role": "user", "content": prompt}],
        )
        raw = response.content[0].text.strip()

        # Strip markdown fences if Claude added them despite instructions
        raw = re.sub(r"^```(?:json)?\s*", "", raw)
        raw = re.sub(r"\s*```$", "", raw)

        data = json.loads(raw)

    except anthropic.AuthenticationError:
        raise AIUnavailableError("Invalid Anthropic API key. Check your ANTHROPIC_API_KEY.")
    except anthropic.RateLimitError:
        raise AIUnavailableError("Anthropic rate limit reached. Please wait a moment and try again.")
    except anthropic.APIStatusError as e:
        raise AIUnavailableError(f"Claude is temporarily unavailable (status {e.status_code}). Please try again shortly.")
    except anthropic.APIConnectionError:
        raise AIUnavailableError("Could not reach Claude. Check your internet connection and try again.")
    except json.JSONDecodeError:
        return _fallback_response()
    except Exception:
        return _fallback_response()

    # Validate and re-compute overall score from dimensions for consistency
    dimensions = data.get("dimensions", {})
    computed_score = calculate_weighted_score(dimensions)

    # Use Claude's score if it's within 5 points of computed; otherwise use computed
    reported = data.get("overall_score", computed_score)
    overall = reported if abs(reported - computed_score) <= 5 else computed_score

    # Build category_scores list (compatible with existing frontend shape)
    category_scores = [
        {
            "name": "Keyword Alignment",
            "score": dimensions.get("keyword_alignment", {}).get("score", 0),
            "max": 100,
            "reasoning": dimensions.get("keyword_alignment", {}).get("reasoning", ""),
            "weight": "30%",
        },
        {
            "name": "Experience Relevance",
            "score": dimensions.get("experience_relevance", {}).get("score", 0),
            "max": 100,
            "reasoning": dimensions.get("experience_relevance", {}).get("reasoning", ""),
            "weight": "25%",
        },
        {
            "name": "Seniority Match",
            "score": dimensions.get("seniority_match", {}).get("score", 0),
            "max": 100,
            "reasoning": dimensions.get("seniority_match", {}).get("reasoning", ""),
            "weight": "15%",
        },
        {
            "name": "Achievement Quality",
            "score": dimensions.get("achievement_quality", {}).get("score", 0),
            "max": 100,
            "reasoning": dimensions.get("achievement_quality", {}).get("reasoning", ""),
            "weight": "15%",
        },
        {
            "name": "Education & Credentials",
            "score": dimensions.get("education_credentials", {}).get("score", 0),
            "max": 100,
            "reasoning": dimensions.get("education_credentials", {}).get("reasoning", ""),
            "weight": "10%",
        },
        {
            "name": "Human Readability",
            "score": dimensions.get("human_readability", {}).get("score", 0),
            "max": 100,
            "reasoning": dimensions.get("human_readability", {}).get("reasoning", ""),
            "weight": "5%",
        },
    ]

    return {
        "ats_score": overall,
        "matched_keywords": data.get("matched_skills", []),
        "missing_keywords": data.get("missing_skills", []),
        "strengths": data.get("strengths", []),
        "gaps": data.get("gaps", []),
        "recruiter_verdict": data.get("recruiter_verdict", ""),
        "category_scores": category_scores,
        "semantic": True,
    }


def _no_jd_response() -> dict:
    return {
        "ats_score": 0,
        "matched_keywords": [],
        "missing_keywords": [],
        "strengths": [],
        "gaps": ["No job description provided — add one for a full ATS analysis."],
        "recruiter_verdict": "Paste a job description to get a semantic ATS score.",
        "category_scores": [],
        "semantic": True,
    }


def _fallback_response() -> dict:
    return {
        "ats_score": 0,
        "matched_keywords": [],
        "missing_keywords": [],
        "strengths": [],
        "gaps": ["Scoring unavailable — check your Anthropic API key and credits."],
        "recruiter_verdict": "The AI scorer could not run. Verify your API key has available credits.",
        "category_scores": [],
        "semantic": True,
    }
