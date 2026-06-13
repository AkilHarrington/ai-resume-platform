# =========================================================
# File: services/resume_service.py
# Purpose:
# Claude-powered resume optimization for the AI Resume Studio platform.
# =========================================================

import os

import anthropic

from services.exceptions import AIUnavailableError


CLAUDE_MODEL = os.getenv("CLAUDE_MODEL", "claude-sonnet-4-6")


def get_anthropic_client() -> anthropic.Anthropic:
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        raise RuntimeError(
            "ANTHROPIC_API_KEY is missing. Set it in your environment or .env file."
        )
    return anthropic.Anthropic(api_key=api_key)


BANNED_PHRASES = [
    "spearheaded", "leveraged", "synergistic", "cross-functional synergies",
    "results-driven", "detail-oriented", "team player", "go-getter",
    "thought leader", "guru", "ninja", "rockstar", "proactive self-starter",
    "dynamic professional", "seasoned professional", "proven track record",
    "value-added", "move the needle", "circle back", "deep dive",
    "paradigm shift", "disruptive", "best-in-class", "world-class",
    "cutting-edge solutions", "robust", "scalable solutions",
]


def build_resume_optimization_prompt(
    resume_text: str,
    job_description: str,
    missing_keywords: list[str],
    original_score: int = 0,
) -> str:
    if original_score < 60:
        keyword_limit = 3
    elif original_score < 75:
        keyword_limit = 5
    else:
        keyword_limit = 8

    limited_keywords = missing_keywords[:keyword_limit]
    banned_list = ", ".join(f'"{p}"' for p in BANNED_PHRASES)

    return f"""You are an expert resume writer hired by a human — not an AI content generator.

Your job is to rewrite this resume so it passes ATS screening AND reads compellingly to a human recruiter.
The final output must sound like it was written by a sharp, articulate human professional — not a language model.

═══ ABSOLUTE RULES ═══
- Return the FULL optimized resume text ONLY — no JSON, no markdown fences, no explanations
- Never invent employers, job titles, degrees, certifications, or skills the candidate does not have
- Never delete existing sections or reduce the candidate's seniority level
- Preserve the overall structure and section order of the original resume
- The output must be at least 80% the length of the original

═══ VOICE & TONE ═══
- Match the writing style and vocabulary level already present in the resume
- Write in the candidate's voice — not in generic corporate language
- Vary sentence structure and length — monotonous bullets are a red flag to human readers
- Avoid all of these overused phrases: {banned_list}

═══ ACHIEVEMENT QUALITY ═══
- Strengthen weak, vague bullets by making them specific and outcome-focused
- If a bullet says "Managed projects" — rewrite to show scope, scale, or result
- Prefer concrete language: numbers, percentages, timeframes, team sizes, dollar amounts
- If no numbers exist in the original, use relative language: "significantly reduced", "led a team of", "across 3 departments"
- Do NOT fabricate specific numbers that are not in the original resume

═══ KEYWORD INTEGRATION ═══
- Integrate these missing keywords ONLY where they are genuinely truthful: {limited_keywords}
- Keywords must flow naturally within sentences — never list keywords or stuff them artificially
- If a keyword cannot be integrated honestly, skip it entirely
- Keyword stuffing is worse than not including the keyword at all

═══ OPTIMIZATION INTENSITY ═══
- Current ATS score: {original_score}
- Score below 60: focus on restructuring weak sections and integrating up to 3 keywords
- Score 60–74: sharpen achievement bullets and integrate up to 5 keywords naturally
- Score 75+: polish language and specificity only — minimal keyword changes

Resume:
{resume_text}

Target job description:
{job_description}

Return the complete optimized resume text only. Do not add any commentary before or after."""


def optimize_resume_text(
    resume_text: str,
    job_description: str,
    missing_keywords: list[str],
    original_score: int = 0,
) -> str:
    prompt = build_resume_optimization_prompt(
        resume_text,
        job_description,
        missing_keywords,
        original_score=original_score,
    )

    client = get_anthropic_client()

    try:
        response = client.messages.create(
            model=CLAUDE_MODEL,
            max_tokens=4096,
            messages=[{"role": "user", "content": prompt}],
        )
        text_output = response.content[0].text.strip()
    except anthropic.AuthenticationError:
        raise AIUnavailableError("Invalid Anthropic API key. Check your ANTHROPIC_API_KEY.")
    except anthropic.RateLimitError:
        raise AIUnavailableError("Anthropic rate limit reached. Please wait a moment and try again.")
    except anthropic.APIStatusError as e:
        raise AIUnavailableError(f"Claude is temporarily unavailable (status {e.status_code}). Please try again shortly.")
    except anthropic.APIConnectionError:
        raise AIUnavailableError("Could not reach Claude. Check your internet connection and try again.")
    except Exception:
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


def generate_cover_letter(
    resume_text: str,
    job_description: str,
    company_name: str = "",
    candidate_name: str = "",
) -> str:
    company_line = f"Company: {company_name}" if company_name else ""
    candidate_line = f"Candidate name: {candidate_name}" if candidate_name else ""

    prompt = f"""You are an expert career coach writing a cover letter for a real human professional.

The letter must sound like it was written by the candidate themselves — confident, specific, and human.
Recruiters read hundreds of AI-generated cover letters daily. This one must not sound like one of them.

═══ STRUCTURE ═══
- Paragraph 1 (Hook): Open with a specific, genuine reason this role and company are compelling — not "I am excited to apply"
- Paragraph 2 (Evidence): Pull 1-2 concrete achievements from the resume that directly address the job's core needs
- Paragraph 3 (Value): Articulate what unique value the candidate brings — connect their background to the company's real situation
- Paragraph 4 (Close): Confident, direct call to action — no begging, no over-thanking

═══ TONE RULES ═══
- Write in first person, conversational but professional
- Avoid: "I am excited to apply", "I am a team player", "I am passionate about", "leveraged", "synergistic"
- No hollow openers. No generic closers. Every sentence must earn its place.
- Match the vocabulary and register of the resume — do not make the candidate sound like someone they are not

═══ CONSTRAINTS ═══
- Do not fabricate experience, companies, or achievements not present in the resume
- Return the cover letter text only — no explanations, no meta-commentary, no subject line

{candidate_line}
{company_line}

Resume:
{resume_text}

Job Description:
{job_description}

Write the cover letter now:"""

    client = get_anthropic_client()

    try:
        response = client.messages.create(
            model=CLAUDE_MODEL,
            max_tokens=1024,
            messages=[{"role": "user", "content": prompt}],
        )
        return response.content[0].text.strip()
    except anthropic.AuthenticationError:
        raise AIUnavailableError("Invalid Anthropic API key. Check your ANTHROPIC_API_KEY.")
    except anthropic.RateLimitError:
        raise AIUnavailableError("Anthropic rate limit reached. Please wait a moment and try again.")
    except anthropic.APIStatusError as e:
        raise AIUnavailableError(f"Claude is temporarily unavailable (status {e.status_code}). Please try again shortly.")
    except anthropic.APIConnectionError:
        raise AIUnavailableError("Could not reach Claude. Check your internet connection and try again.")
    except Exception:
        return ""


def generate_linkedin_optimization(
    resume_text: str,
    job_description: str = "",
    target_role: str = "",
) -> dict:
    target_line = f"Target role: {target_role}" if target_role else ""
    jd_section = f"\nTarget Job Description:\n{job_description}" if job_description else ""

    prompt = f"""You are a LinkedIn optimization expert and career strategist.

Based on the resume below, generate optimized LinkedIn profile content.

{target_line}

Resume:
{resume_text}
{jd_section}

Return your response in this exact format:

HEADLINE:
[Write a compelling LinkedIn headline, max 220 characters, keyword-rich]

SUMMARY:
[Write a professional LinkedIn About section, 3-5 paragraphs, first person, engaging and keyword-optimized]

Return only the headline and summary in the format above."""

    client = get_anthropic_client()

    try:
        response = client.messages.create(
            model=CLAUDE_MODEL,
            max_tokens=1024,
            messages=[{"role": "user", "content": prompt}],
        )
        text = response.content[0].text.strip()

        headline = ""
        summary = ""

        if "HEADLINE:" in text and "SUMMARY:" in text:
            parts = text.split("SUMMARY:")
            headline_part = parts[0].replace("HEADLINE:", "").strip()
            summary_part = parts[1].strip() if len(parts) > 1 else ""
            headline = headline_part
            summary = summary_part
        else:
            headline = text[:220]
            summary = text

        return {"headline": headline, "summary": summary}
    except anthropic.AuthenticationError:
        raise AIUnavailableError("Invalid Anthropic API key. Check your ANTHROPIC_API_KEY.")
    except anthropic.RateLimitError:
        raise AIUnavailableError("Anthropic rate limit reached. Please wait a moment and try again.")
    except anthropic.APIStatusError as e:
        raise AIUnavailableError(f"Claude is temporarily unavailable (status {e.status_code}). Please try again shortly.")
    except anthropic.APIConnectionError:
        raise AIUnavailableError("Could not reach Claude. Check your internet connection and try again.")
    except Exception:
        return {"headline": "", "summary": ""}
