# =========================================================
# File: services/resume_service.py
# Purpose:
# Claude-powered resume optimization for the AI Resume Studio platform.
# =========================================================

import logging
import os

import httpx
import anthropic

from services.exceptions import AIUnavailableError


logger = logging.getLogger("ai_resume_studio.resume_service")

CLAUDE_MODEL = os.getenv("CLAUDE_MODEL", "claude-sonnet-4-6")

# =========================================================
# Singleton client — instantiated once, reused across requests
# =========================================================

_client: anthropic.Anthropic | None = None


def _get_client() -> anthropic.Anthropic:
    global _client
    if _client is None:
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            raise RuntimeError(
                "ANTHROPIC_API_KEY is missing. Set it in your environment or .env file."
            )
        _client = anthropic.Anthropic(
            api_key=api_key,
            timeout=httpx.Timeout(120.0, connect=10.0),  # 120s total, 10s connect
        )
    return _client


BANNED_PHRASES = [
    "spearheaded", "leveraged", "synergistic", "cross-functional synergies",
    "results-driven", "detail-oriented", "team player", "go-getter",
    "thought leader", "guru", "ninja", "rockstar", "proactive self-starter",
    "dynamic professional", "seasoned professional", "proven track record",
    "value-added", "move the needle", "circle back", "deep dive",
    "paradigm shift", "disruptive", "best-in-class", "world-class",
    "cutting-edge solutions", "robust", "scalable solutions",
]

# =========================================================
# Static system prompt — never changes between calls.
# Marked cache_control=ephemeral so Anthropic caches the
# processed tokens, cutting latency ~85% on warm hits.
# =========================================================

OPTIMIZER_SYSTEM_PROMPT = """You are an expert resume writer hired by a human — not an AI content generator.

Your job is to rewrite this resume so it passes ATS screening AND reads compellingly to a human recruiter.
The final output must sound like it was written by a sharp, articulate human professional — not a language model.

═══ ABSOLUTE RULES ═══
- Return the FULL optimized resume text ONLY — no JSON, no markdown fences, no explanations
- Never invent employers, job titles, degrees, certifications, or metrics the candidate does not have
- Never delete existing sections or reduce the candidate's seniority level
- Preserve the overall structure and section order of the original resume
- The output must be at least 90% the length of the original
- NAMED TOOLS ARE NEVER INFERRED: Never add any specific named software, platform, or tool — Google Analytics,
  Salesforce, Lucid, Kantar, Tableau, HubSpot, Asana, or any other — unless that exact name already appears in the
  original resume. Do not reason "they probably used it." Do not add it to Skills. Do not mention it in a bullet.
  If the tool name is not in the source text, it does not exist for this candidate. This rule has no exceptions.

═══ VOICE & TONE ═══
- Match the writing style and vocabulary level already present in the resume
- Write in the candidate's voice — not in generic corporate language
- Vary sentence structure and length — monotonous bullets are a red flag to human readers
- Avoid all of these overused phrases: "spearheaded", "leveraged", "synergistic", "cross-functional synergies",
  "results-driven", "detail-oriented", "team player", "go-getter", "thought leader", "guru", "ninja", "rockstar",
  "proactive self-starter", "dynamic professional", "seasoned professional", "proven track record", "value-added",
  "move the needle", "circle back", "deep dive", "paradigm shift", "disruptive", "best-in-class", "world-class",
  "cutting-edge solutions", "robust", "scalable solutions"

═══ ACHIEVEMENT QUALITY ═══
- Strengthen weak, vague bullets by making them specific and outcome-focused
- If a bullet says "Managed projects" — rewrite to show scope, scale, or result
- Prefer concrete language: numbers, percentages, timeframes, team sizes, dollar amounts
- If the original has no specific numbers, use relative language that is truthful: "led a team of", "across 3 departments", "within 6 months"
- Do NOT fabricate specific numbers or metrics that are not in the original resume

═══ SKILLS SECTION AUDIT ═══
- Read every bullet in the Experience section and identify skills and competencies mentioned there
- Any skill or competency that appears in experience bullets but is missing from the Skills section should be added
- TOOL EXCEPTION: Named software/platforms follow the absolute rule above — only add a tool to Skills if it is
  already named somewhere in the original resume. Do not promote a tool from a bullet you just wrote.
- Example of correct: original says "managed campaigns in Google Analytics" → add Google Analytics to Skills ✓
- Example of incorrect: you rewrote a bullet to mention Google Analytics → now add it to Skills ✗ (double fabrication)

═══ SURFACE IMPLICIT COMPETENCIES ═══
Many candidates undersell themselves by describing WHAT they did without naming the competency.
Your job is to make the implicit explicit — using only what is honestly evidenced in the original resume.

This section covers COMPETENCY LANGUAGE only — not named tools (see absolute rule above).

- STAKEHOLDER COMMUNICATION: If bullets describe presenting to senior buyers, directing agency partners, leading
  cross-functional reviews, or reporting to leadership — rewrite to explicitly name "senior stakeholder communication",
  "executive-level presentations", or "C-suite reporting". Only apply where evidence exists in the original.

- PERFORMANCE REPORTING: If the original resume cites brand awareness %, sales lift %, campaign ROI, or other tracked
  metrics — the candidate was doing performance tracking. Reframe those bullets using language like "brand health
  reporting", "performance analytics", or "campaign measurement". The original metrics prove the activity is real.

- CONSUMER/MARKET RESEARCH: If the original describes launch strategy, positioning, segmentation, or audience analysis
  — surface "consumer insights", "market research", or "audience analysis" explicitly where the evidence supports it.

- NEVER apply these patterns to generate tool names. "They tracked metrics" → can surface "performance reporting" ✓.
  "They tracked metrics" → cannot surface "Google Analytics" or "Tableau" ✗.

═══ SUMMARY ALIGNMENT ═══
- The summary is the highest-value ATS section — optimize it first
- Rewrite the summary so its language closely mirrors the terminology in the job description
- Do not change what the candidate claims — only restate existing experience using the JD's phrasing
- Example: if the JD says "brand strategy" and the summary says "building consumer brands", rewrite to use "brand strategy"
- The summary must still sound human and specific — not a keyword list

═══ KEYWORD INTEGRATION ═══
- Missing keywords will be provided in the user message labeled "Missing keywords"
- FIRST: split the list into two categories before acting on it:
    A) COMPETENCY keywords (brand strategy, P&L ownership, C-suite communication, consumer insights, etc.)
       → integrate if the candidate's experience honestly supports it
    B) NAMED TOOL keywords (Google Analytics, Salesforce, Lucid, Kantar, Tableau, etc.)
       → skip entirely unless that exact tool name is already in the original resume
- For category A: integrate naturally in summary, bullets, or skills — wherever it fits best
- For category B: do not add, do not mention, do not reference — treat as if the keyword does not exist
- Keywords must flow naturally within sentences — never stuff or list them artificially
- Prioritize placing category A keywords in: (1) Summary, (2) Skills section, (3) Experience bullets

═══ CONTACT INFORMATION ═══
- If the resume includes a full street address (house number, street name, apartment, zip code), remove it
- Replace with City, State only — e.g. "Austin, TX" — never include a street address in the output
- Email, phone, and LinkedIn URL should be preserved as-is
- This protects the candidate's privacy: resumes circulate widely within companies before any offer

═══ ATS SCORE CONTEXT ═══
- The current ATS score will be labeled "Current ATS score" in the user message
- Every resume, regardless of starting score, has room for authentic improvement
- Do not hold back on legitimate improvements out of excessive caution
- The goal is the highest possible honest score — not a minimal edit

The user message contains: missing keywords, current ATS score, resume text (in <resume> tags), and job description (in <job_description> tags).
Return the complete optimized resume text only. Do not add any commentary before or after."""


def _calc_max_tokens(resume_text: str) -> int:
    """Dynamic max_tokens: ~1.4 tokens/word × 1.3 buffer, clamped to [1500, 4096].
    Avoids 8192 over-allocation which increases time-to-first-token unnecessarily.
    """
    word_count = len(resume_text.split())
    return max(1500, min(int(word_count * 1.4 * 1.3), 4096))


def _build_optimizer_user_message(
    resume_text: str,
    job_description: str,
    missing_keywords: list[str],
    original_score: int = 0,
    keyword_signal: str = "",
) -> str:
    keywords_list = ", ".join(f'"{k}"' for k in missing_keywords) if missing_keywords else "none identified"
    signal_block = f"\n{keyword_signal}" if keyword_signal else ""
    return f"""Missing keywords from this job description: {keywords_list}

Current ATS score: {original_score}{signal_block}

<resume>
{resume_text}
</resume>

<job_description>
{job_description}
</job_description>"""


def stream_resume_optimization(
    resume_text: str,
    job_description: str,
    missing_keywords: list[str],
    original_score: int = 0,
):
    """Generator: streams optimized resume text chunk by chunk.

    Uses a cached system prompt (cache_control=ephemeral) so Anthropic skips
    re-processing the ~1,200-token instruction block on warm cache hits —
    cutting time-to-first-token by up to 85% after the first call.
    Dynamic max_tokens avoids 8192 over-allocation for typical resume lengths.

    Keyword intelligence: a pure-code algorithmic layer queries scan_results
    for historical keyword patterns in this job category and injects grounded
    signals into the user message (NOT the system prompt, preserving cache).
    Falls back silently to no injection if insufficient data or query fails.
    """
    # Pure-code keyword intelligence — no AI, no network cost beyond one Supabase read
    from services.keyword_intelligence_service import (
        extract_job_category,
        get_role_keywords,
        build_keyword_signal_block,
    )
    job_category = extract_job_category(job_description)
    role_keywords = get_role_keywords(job_category)
    keyword_signal = build_keyword_signal_block(role_keywords, job_category)

    user_message = _build_optimizer_user_message(
        resume_text, job_description, missing_keywords, original_score, keyword_signal
    )
    max_tokens = _calc_max_tokens(resume_text)
    client = _get_client()

    try:
        with client.messages.stream(
            model=CLAUDE_MODEL,
            max_tokens=max_tokens,
            system=[{
                "type": "text",
                "text": OPTIMIZER_SYSTEM_PROMPT,
                "cache_control": {"type": "ephemeral"},
            }],
            messages=[{"role": "user", "content": user_message}],
        ) as stream:
            for text in stream.text_stream:
                yield text
    except anthropic.AuthenticationError:
        raise AIUnavailableError("Invalid Anthropic API key. Check your ANTHROPIC_API_KEY.")
    except anthropic.RateLimitError:
        raise AIUnavailableError("Anthropic rate limit reached. Please wait a moment and try again.")
    except anthropic.APIStatusError as e:
        raise AIUnavailableError(f"Claude is temporarily unavailable (status {e.status_code}). Please try again shortly.")
    except anthropic.APIConnectionError:
        raise AIUnavailableError("Could not reach Claude. Check your internet connection and try again.")
    except Exception as e:
        logger.error("stream_resume_optimization unexpected error: %s: %s", type(e).__name__, e)
        raise AIUnavailableError("Resume optimization encountered an unexpected error. Please try again.")


def _build_cover_letter_prompt(
    resume_text: str,
    job_description: str,
    company_name: str = "",
    candidate_name: str = "",
) -> str:
    company_line = f"Company: {company_name}" if company_name else ""
    candidate_line = f"Candidate name: {candidate_name}" if candidate_name else ""
    return f"""You are an expert career coach writing a cover letter for a real human professional.

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

<resume>
{resume_text}
</resume>

<job_description>
{job_description}
</job_description>

Write the cover letter now:"""


def _build_linkedin_prompt(
    resume_text: str,
    job_description: str = "",
    target_role: str = "",
) -> str:
    target_line = f"Target role: {target_role}" if target_role else ""
    jd_section = f"\n<job_description>\n{job_description}\n</job_description>" if job_description else ""
    return f"""You are a LinkedIn optimization expert and career strategist.

Based on the resume below, generate optimized LinkedIn profile content.

{target_line}

<resume>
{resume_text}
</resume>
{jd_section}

Return your response in this exact format:

HEADLINE:
[Write a compelling LinkedIn headline, max 220 characters, keyword-rich]

SUMMARY:
[Write a professional LinkedIn About section. Target 1,800–2,200 characters (roughly 300–350 words).
Use 3–4 short paragraphs. First person. Engaging, specific, and keyword-optimized.
Do NOT pad to fill space — quality over length. Hook the reader in the first two sentences
since LinkedIn truncates the preview at ~300 characters on desktop.]

Return only the headline and summary in the format above."""


def generate_cover_letter(
    resume_text: str,
    job_description: str,
    company_name: str = "",
    candidate_name: str = "",
) -> str:
    prompt = _build_cover_letter_prompt(resume_text, job_description, company_name, candidate_name)
    client = _get_client()
    try:
        response = client.messages.create(
            model=CLAUDE_MODEL,
            max_tokens=1500,
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
    except Exception as e:
        logger.error("generate_cover_letter unexpected error: %s: %s", type(e).__name__, e)
        raise AIUnavailableError("Cover letter generation encountered an unexpected error. Please try again.")


def stream_cover_letter(
    resume_text: str,
    job_description: str,
    company_name: str = "",
    candidate_name: str = "",
):
    """Generator: yields raw text chunks from Claude's streaming API."""
    prompt = _build_cover_letter_prompt(resume_text, job_description, company_name, candidate_name)
    client = _get_client()
    try:
        with client.messages.stream(
            model=CLAUDE_MODEL,
            max_tokens=1500,
            messages=[{"role": "user", "content": prompt}],
        ) as stream:
            for text in stream.text_stream:
                yield text
    except anthropic.AuthenticationError:
        raise AIUnavailableError("Invalid Anthropic API key. Check your ANTHROPIC_API_KEY.")
    except anthropic.RateLimitError:
        raise AIUnavailableError("Anthropic rate limit reached. Please wait a moment and try again.")
    except anthropic.APIStatusError as e:
        raise AIUnavailableError(f"Claude is temporarily unavailable (status {e.status_code}). Please try again shortly.")
    except anthropic.APIConnectionError:
        raise AIUnavailableError("Could not reach Claude. Check your internet connection and try again.")


def generate_linkedin_optimization(
    resume_text: str,
    job_description: str = "",
    target_role: str = "",
) -> dict:
    prompt = _build_linkedin_prompt(resume_text, job_description, target_role)
    client = _get_client()
    try:
        response = client.messages.create(
            model=CLAUDE_MODEL,
            max_tokens=1500,
            messages=[{"role": "user", "content": prompt}],
        )
        text = response.content[0].text.strip()
        return _parse_linkedin_text(text)
    except anthropic.AuthenticationError:
        raise AIUnavailableError("Invalid Anthropic API key. Check your ANTHROPIC_API_KEY.")
    except anthropic.RateLimitError:
        raise AIUnavailableError("Anthropic rate limit reached. Please wait a moment and try again.")
    except anthropic.APIStatusError as e:
        raise AIUnavailableError(f"Claude is temporarily unavailable (status {e.status_code}). Please try again shortly.")
    except anthropic.APIConnectionError:
        raise AIUnavailableError("Could not reach Claude. Check your internet connection and try again.")
    except Exception as e:
        logger.error("generate_linkedin_optimization unexpected error: %s: %s", type(e).__name__, e)
        raise AIUnavailableError("LinkedIn optimization encountered an unexpected error. Please try again.")


def stream_linkedin_optimization(
    resume_text: str,
    job_description: str = "",
    target_role: str = "",
):
    """Generator: yields raw text chunks from Claude's streaming API."""
    prompt = _build_linkedin_prompt(resume_text, job_description, target_role)
    client = _get_client()
    try:
        with client.messages.stream(
            model=CLAUDE_MODEL,
            max_tokens=2000,
            messages=[{"role": "user", "content": prompt}],
        ) as stream:
            for text in stream.text_stream:
                yield text
    except anthropic.AuthenticationError:
        raise AIUnavailableError("Invalid Anthropic API key. Check your ANTHROPIC_API_KEY.")
    except anthropic.RateLimitError:
        raise AIUnavailableError("Anthropic rate limit reached. Please wait a moment and try again.")
    except anthropic.APIStatusError as e:
        raise AIUnavailableError(f"Claude is temporarily unavailable (status {e.status_code}). Please try again shortly.")
    except anthropic.APIConnectionError:
        raise AIUnavailableError("Could not reach Claude. Check your internet connection and try again.")


# =========================================================
# Professional Summary Generator — Claude Haiku (fast)
# =========================================================

def generate_professional_summary(
    resume_text: str,
    target_role: str = "",
    years_experience: str = "",
) -> str:
    """Generate a 3-4 sentence professional summary. Uses Haiku for speed."""
    role_line = f"Target role: {target_role}" if target_role else ""
    exp_line  = f"Years of experience: {years_experience}" if years_experience else ""

    prompt = f"""You are a certified professional resume writer.

Based on the resume below, write a 3-4 sentence professional summary for the top of the resume.

Rules:
- Write entirely in third person — use job title or noun phrase, NEVER the candidate's name
- Every sentence must begin with a title or noun, not the candidate's name (WRONG: "John Smith has..." RIGHT: "An operations leader with...")
- First sentence: professional identity + years of experience (e.g. "Operations Coordinator with 6 years...")
- Second sentence: 1-2 specific, concrete achievements or areas of expertise drawn from the resume
- Third sentence: value statement aligned to the target role — what the candidate brings
- Optional fourth sentence only if it adds real information; otherwise stop at three
- No hollow phrases: no "results-driven", "team player", "passionate about", "dynamic", "detail-oriented"
- Sound like a human wrote it — varied sentence structure, specific language

{role_line}
{exp_line}

<resume>
{resume_text}
</resume>

Return only the professional summary text. No labels, no intro, no commentary."""

    client = _get_client()
    try:
        response = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=400,
            messages=[{"role": "user", "content": prompt}],
        )
        return response.content[0].text.strip()
    except anthropic.AuthenticationError:
        raise AIUnavailableError("Invalid Anthropic API key.")
    except anthropic.RateLimitError:
        raise AIUnavailableError("Anthropic rate limit reached. Please wait a moment and try again.")
    except anthropic.APIStatusError as e:
        raise AIUnavailableError(f"Claude is temporarily unavailable (status {e.status_code}).")
    except anthropic.APIConnectionError:
        raise AIUnavailableError("Could not reach Claude. Check your internet connection.")
    except Exception as e:
        logger.error("generate_professional_summary unexpected error: %s: %s", type(e).__name__, e)
        raise AIUnavailableError("Summary generation encountered an unexpected error.")


# =========================================================
# Bullet Point Enhancer — Claude Haiku (fast)
# =========================================================

def enhance_bullet_point(bullet_text: str, target_role: str = "") -> str:
    """Rewrite a weak bullet point as strong, quantified, action-verb-led."""
    role_line = f"Target role: {target_role}" if target_role else ""

    prompt = f"""You are an expert resume writer.

Rewrite this resume bullet point to be stronger, more specific, and results-focused.

Rules:
- Start with a strong action verb (past tense for previous roles, present for current)
- Where the original implies a measurable result but gives no number, insert a bracketed placeholder: [X%], [X hrs/week], [$X], [team of X], etc. — so the user knows exactly where to add their real figure
- Do NOT invent specific numbers, tools, or companies not present or implied in the original
- Use placeholders generously — they are more useful than vague language
- Maximum 1-2 lines — a bullet, not a paragraph
- No hollow phrases: no "spearheaded", "leveraged", "synergistic", "results-driven", "team player"
- Return only the improved bullet text — no label, no explanation, no asterisk, no dash prefix

{role_line}

Original bullet:
{bullet_text}

Improved bullet:"""

    client = _get_client()
    try:
        response = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=180,
            messages=[{"role": "user", "content": prompt}],
        )
        return response.content[0].text.strip().lstrip("•-– ").strip()
    except anthropic.AuthenticationError:
        raise AIUnavailableError("Invalid Anthropic API key.")
    except anthropic.RateLimitError:
        raise AIUnavailableError("Anthropic rate limit reached. Please wait a moment and try again.")
    except anthropic.APIStatusError as e:
        raise AIUnavailableError(f"Claude is temporarily unavailable (status {e.status_code}).")
    except anthropic.APIConnectionError:
        raise AIUnavailableError("Could not reach Claude. Check your internet connection.")
    except Exception as e:
        logger.error("enhance_bullet_point unexpected error: %s: %s", type(e).__name__, e)
        raise AIUnavailableError("Bullet enhancement encountered an unexpected error.")


def _parse_linkedin_text(text: str) -> dict:
    if "HEADLINE:" in text and "SUMMARY:" in text:
        summary_idx = text.index("SUMMARY:")
        headline = text[:summary_idx].replace("HEADLINE:", "").strip()
        summary = text[summary_idx + len("SUMMARY:"):].strip()
        return {"headline": headline, "summary": summary}
    return {"headline": text[:220], "summary": text}
