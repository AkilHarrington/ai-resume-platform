# =========================================================
# File: services/resume_parser.py
# Purpose:
# Lightweight deterministic resume parser for raw resume text.
#
# Responsibilities:
# - detect common resume section headings
# - normalize heading aliases into one canonical schema
# - extract basic identity/contact information
# - return a frontend/backend-friendly structured resume object
# - handle plain-text resumes that do not use bullet symbols
# =========================================================

import re
from typing import Dict, Optional


SECTION_ALIASES = {
    "summary": [
        "summary",
        "professional summary",
        "profile",
        "professional profile",
        "executive summary",
    ],
    "skills": [
        "skills",
        "core competencies",
        "areas of expertise",
        "key skills",
        "technical skills",
    ],
    "experience": [
        "experience",
        "professional experience",
        "work experience",
        "employment history",
        "career history",
    ],
    "education": [
        "education",
        "academic background",
        "education and training",
    ],
    "certifications": [
        "certifications",
        "licenses",
        "professional certifications",
    ],
}

ACTION_LINE_STARTERS = {
    "led", "managed", "developed", "implemented", "coordinated",
    "improved", "oversaw", "built", "created", "delivered",
    "designed", "presented", "analyzed", "supported", "established",
    "launched", "reduced", "increased", "monitored", "executed",
    "directed", "drove", "drive", "manage", "lead", "oversee",
    "partnered", "facilitated", "maintained", "tracked", "prepared",
    "supervised", "owned", "administered",
}


def normalize_heading(text: str) -> str:
    return re.sub(r"[^a-z ]", "", text.lower()).strip()


def detect_section_key(heading: str) -> Optional[str]:
    normalized = normalize_heading(heading)

    for key, aliases in SECTION_ALIASES.items():
        for alias in aliases:
            if normalized == alias:
                return key

    return None


def is_email(text: str) -> bool:
    return "@" in text and "." in text


def looks_like_location(text: str) -> bool:
    return "," in text and len(text.split()) <= 6


def looks_like_date_range(text: str) -> bool:
    return bool(re.search(r"\b(19|20)\d{2}\b", text))


def is_bullet(text: str) -> bool:
    return text.startswith("•") or text.startswith("-")


def strip_bullet(text: str) -> str:
    return re.sub(r"^[•\-]\s*", "", text).strip()


def looks_like_action_line(text: str) -> bool:
    cleaned = str(text).strip()
    if not cleaned:
        return False

    cleaned = cleaned.lstrip("•-–— ").strip()
    if not cleaned:
        return False

    first_word = cleaned.split()[0].lower()
    first_word = re.sub(r"[^a-zA-Z\-]", "", first_word)

    return first_word in ACTION_LINE_STARTERS


def looks_like_company_title_inline(text: str) -> bool:
    return " — " in text or " – " in text or " - " in text


def split_company_title_inline(text: str) -> tuple[str, str]:
    for sep in (" — ", " – ", " - "):
        if sep in text:
            parts = text.split(sep, 1)
            return parts[0].strip(), parts[1].strip()
    return text.strip(), ""


def parse_resume_text(resume_text: str) -> Dict:
    lines = [line.strip() for line in resume_text.split("\n") if line.strip()]

    structured = {
        "fullName": lines[0] if lines else "",
        "headline": lines[1] if len(lines) > 1 else "",
        "contact": {
            "email": None,
            "phone": None,
            "location": None,
            "linkedin": None,
            "portfolio": None,
        },
        "summary": "",
        "skills": [],
        "experience": [],
        "education": [],
        "certifications": [],
    }

    current_section = None
    current_experience = None

    index = 2

    # Contact block
    while index < len(lines) and detect_section_key(lines[index]) is None:
        line = lines[index]

        if is_email(line) and structured["contact"]["email"] is None:
            structured["contact"]["email"] = line
        elif looks_like_location(line) and structured["contact"]["location"] is None:
            structured["contact"]["location"] = line
        elif "linkedin.com" in line.lower() and structured["contact"]["linkedin"] is None:
            structured["contact"]["linkedin"] = line
        elif (
            "github.com" in line.lower()
            or "portfolio" in line.lower()
            or "www." in line.lower()
        ) and structured["contact"]["portfolio"] is None:
            structured["contact"]["portfolio"] = line

        index += 1

    while index < len(lines):
        line = lines[index]
        section_key = detect_section_key(line)

        if section_key:
            if current_experience:
                structured["experience"].append(current_experience)
                current_experience = None

            current_section = section_key
            index += 1
            continue

        if current_section == "summary":
            structured["summary"] = (
                f"{structured['summary']} {line}".strip()
                if structured["summary"]
                else line
            )
            index += 1
            continue

        if current_section == "skills":
            structured["skills"].append(strip_bullet(line) if is_bullet(line) else line)
            index += 1
            continue

        if current_section == "experience":
            # Bullet line
            if is_bullet(line):
                if current_experience is None:
                    current_experience = {
                        "company": "",
                        "title": "",
                        "startDate": None,
                        "endDate": None,
                        "location": None,
                        "bullets": [],
                    }

                current_experience["bullets"].append(strip_bullet(line))
                index += 1
                continue

            # Plain action line without bullet symbol
            if looks_like_action_line(line):
                if current_experience is None:
                    current_experience = {
                        "company": "",
                        "title": "",
                        "startDate": None,
                        "endDate": None,
                        "location": None,
                        "bullets": [],
                    }

                current_experience["bullets"].append(line)
                index += 1
                continue

            # If we hit a new company/title block, close the previous role
            if current_experience and (
                current_experience["company"]
                or current_experience["title"]
                or current_experience["bullets"]
            ):
                structured["experience"].append(current_experience)
                current_experience = None

            company = line
            title = ""
            start_date = None
            end_date = None

            # Inline company/title case
            if looks_like_company_title_inline(line):
                company, title = split_company_title_inline(line)
                current_experience = {
                    "company": company,
                    "title": title,
                    "startDate": None,
                    "endDate": None,
                    "location": None,
                    "bullets": [],
                }
                index += 1
                continue

            next_line = lines[index + 1] if index + 1 < len(lines) else None
            next_next_line = lines[index + 2] if index + 2 < len(lines) else None

            # Standard company then title layout
            if (
                next_line
                and detect_section_key(next_line) is None
                and not is_bullet(next_line)
                and not looks_like_action_line(next_line)
                and not looks_like_date_range(next_line)
            ):
                title = next_line

            if next_next_line and looks_like_date_range(next_next_line):
                date_text = next_next_line
                if "–" in date_text:
                    parts = [part.strip() for part in date_text.split("–", 1)]
                    start_date = parts[0] if parts else None
                    end_date = parts[1] if len(parts) > 1 else None
                elif "-" in date_text:
                    parts = [part.strip() for part in date_text.split("-", 1)]
                    start_date = parts[0] if parts else None
                    end_date = parts[1] if len(parts) > 1 else None
                else:
                    start_date = date_text

            current_experience = {
                "company": company,
                "title": title,
                "startDate": start_date,
                "endDate": end_date,
                "location": None,
                "bullets": [],
            }

            index += 1
            if title:
                index += 1
            if next_next_line and looks_like_date_range(next_next_line):
                index += 1
            continue

        if current_section == "education":
            institution = line
            degree = None

            next_line = lines[index + 1] if index + 1 < len(lines) else None
            if (
                next_line
                and detect_section_key(next_line) is None
                and not is_bullet(next_line)
                and not looks_like_action_line(next_line)
            ):
                degree = next_line

            structured["education"].append(
                {
                    "institution": institution,
                    "degree": degree,
                    "fieldOfStudy": None,
                    "graduationDate": None,
                    "location": None,
                }
            )

            index += 1
            if degree:
                index += 1
            continue

        if current_section == "certifications":
            structured["certifications"].append(
                {
                    "name": strip_bullet(line) if is_bullet(line) else line,
                    "issuer": None,
                    "date": None,
                }
            )
            index += 1
            continue

        index += 1

    if current_experience:
        structured["experience"].append(current_experience)

    return structured