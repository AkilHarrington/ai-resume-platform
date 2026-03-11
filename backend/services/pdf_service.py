# =========================================================
# File: services/pdf_service.py
# Purpose:
# Generate resume PDF files from structured resume JSON.
#
# Responsibilities:
# - format resume content into a PDF document
# - support multiple resume templates
# - apply layout, typography, spacing, and divider rules
# - save generated PDF files for frontend download
#
# Key Notes:
# - this file handles export formatting only
# - it should not contain AI generation logic
# - frontend passes structured resume_data + template choice
# - templates currently supported:
#     - professional
#     - modern
#     - executive
# =========================================================

# =========================================================
# Imports
# =========================================================

import os
import re

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas


# =========================================================
# Constants
# =========================================================

GENERATED_DIR = "generated"


# =========================================================
# File / Filename Helpers
# =========================================================

def safe_filename(name: str) -> str:
    """
    Convert a resume name into a safe filename.

    Example:
    'Jane Doe' -> 'jane_doe'
    """
    name = name.strip().lower()
    name = re.sub(r"[^a-z0-9]+", "_", name)
    return name.strip("_") or "resume"


# =========================================================
# Text Layout Helpers
# =========================================================

def wrap_text(text, max_chars=95):
    """
    Wrap text into multiple lines based on a rough max character limit.

    Notes:
    - This is a simple character-based wrapper for MVP use.
    - It works well enough for resume export and keeps layout predictable.
    """
    words = text.split()
    lines = []
    current = ""

    for word in words:
        test = f"{current} {word}".strip()
        if len(test) <= max_chars:
            current = test
        else:
            lines.append(current)
            current = word

    if current:
        lines.append(current)

    return lines


def draw_line_if_needed(pdf, y, cfg):
    """
    Start a new page when vertical space is too low.

    Returns:
    - current y position (either same page or reset to top of new page)
    """
    if y < 0.8 * inch:
        pdf.showPage()
        return cfg["start_y"]
    return y


def estimate_subtitle(resume_data: dict) -> str:
    """
    Use the first experience title as the subtitle when applicable.

    This is primarily used by the modern and executive templates.
    """
    experience = resume_data.get("professional_experience", [])
    if experience and experience[0].get("title"):
        return experience[0]["title"]
    return ""


# =========================================================
# Template Configuration
# =========================================================

def get_pdf_template_config(template: str):
    """
    Return layout and styling settings for each supported PDF template.
    """
    if template == "executive":
        return {
            "name_font": ("Helvetica-Bold", 21),
            "subtitle_font": ("Helvetica", 11.5),
            "body_font": ("Helvetica", 11.1),
            "heading_font": ("Helvetica-Bold", 12.5),
            "company_font": ("Helvetica-Bold", 11.8),
            "title_font": ("Helvetica-Oblique", 11.1),
            "line_gap": 15,
            "left": 0.9 * inch,
            "start_y": 10.35 * inch,
            "header_gap": 24,
            "section_gap": 18,
            "bullet_gap": 4,
            "draw_rule": True,
            "heading_caps": True,
            "skills_style": "pipes",
            "role_layout": "stacked",
            "accent": colors.HexColor("#1f2937"),
        }

    if template == "modern":
        return {
            "name_font": ("Helvetica-Bold", 17.5),
            "subtitle_font": ("Helvetica-Oblique", 11),
            "body_font": ("Helvetica", 10.8),
            "heading_font": ("Helvetica-Oblique", 11.8),
            "company_font": ("Helvetica-Bold", 11.3),
            "title_font": ("Helvetica-Oblique", 10.8),
            "line_gap": 15,
            "left": 0.85 * inch,
            "start_y": 10.45 * inch,
            "header_gap": 22,
            "section_gap": 16,
            "bullet_gap": 5,
            "draw_rule": True,
            "heading_caps": False,
            "skills_style": "inline-dots",
            "role_layout": "title-first",
            "accent": colors.HexColor("#2563eb"),
        }

    # Default = professional
    return {
        "name_font": ("Helvetica-Bold", 15.5),
        "subtitle_font": ("Helvetica", 0),
        "body_font": ("Helvetica", 10.3),
        "heading_font": ("Helvetica-Bold", 11),
        "company_font": ("Helvetica-Bold", 11),
        "title_font": ("Helvetica-Oblique", 10.4),
        "line_gap": 13,
        "left": 0.65 * inch,
        "start_y": 10.55 * inch,
        "header_gap": 18,
        "section_gap": 12,
        "bullet_gap": 2,
        "draw_rule": False,
        "heading_caps": True,
        "skills_style": "bullets",
        "role_layout": "company-first-inline",
        "accent": colors.black,
    }


# =========================================================
# Bullet Rendering Helpers
# =========================================================

def draw_bullets(pdf, items, y, cfg):
    """
    Draw a bullet list and return the updated y position.
    """
    left = cfg["left"]
    pdf.setFont(cfg["body_font"][0], cfg["body_font"][1])

    for item in items:
        for idx, line in enumerate(wrap_text(item, 88)):
            y = draw_line_if_needed(pdf, y, cfg)
            prefix = "• " if idx == 0 else "  "
            pdf.drawString(left + 10, y, f"{prefix}{line}")
            y -= cfg["line_gap"]

    return y - cfg["bullet_gap"]


# =========================================================
# Main PDF Export Entry Point
# =========================================================

def create_resume_pdf(resume_data: dict, template: str = "professional") -> str:
    """
    Create a PDF resume file from structured resume JSON and return the file path.

    Flow:
    1. Create output folder if needed
    2. Build PDF canvas
    3. Apply selected template config
    4. Render all resume sections
    5. Save PDF to generated directory
    """
    os.makedirs(GENERATED_DIR, exist_ok=True)

    filename = f"{safe_filename(resume_data.get('full_name', 'resume'))}_{template}_resume.pdf"
    file_path = os.path.join(GENERATED_DIR, filename)

    pdf = canvas.Canvas(file_path, pagesize=letter)
    width, height = letter
    cfg = get_pdf_template_config(template)

    left = cfg["left"]
    y = cfg["start_y"]

    # =====================================================
    # Header Rendering
    # =====================================================

    pdf.setFillColor(cfg["accent"])
    pdf.setFont(cfg["name_font"][0], cfg["name_font"][1])
    pdf.drawCentredString(width / 2, y, resume_data.get("full_name", ""))
    y -= 18

    subtitle = estimate_subtitle(resume_data)
    if subtitle and cfg["subtitle_font"][1] > 0:
        pdf.setFont(cfg["subtitle_font"][0], cfg["subtitle_font"][1])
        pdf.drawCentredString(width / 2, y, subtitle)
        y -= 16

    contact_parts = [
        resume_data.get("location", ""),
        resume_data.get("phone", ""),
        resume_data.get("email", ""),
    ]
    contact_line = " | ".join([p for p in contact_parts if p])

    pdf.setFillColor(colors.black)
    pdf.setFont(cfg["body_font"][0], 10)
    pdf.drawCentredString(width / 2, y, contact_line)
    y -= cfg["header_gap"]

    if cfg["draw_rule"]:
        pdf.setStrokeColor(cfg["accent"])
        pdf.line(left, y, width - left, y)
        y -= 20  # extra spacing so divider does not overlap following text

    # =====================================================
    # Nested Section Drawing Helpers
    # =====================================================

    def draw_heading(title):
        nonlocal y

        y = draw_line_if_needed(pdf, y, cfg)
        pdf.setFillColor(cfg["accent"])
        pdf.setFont(cfg["heading_font"][0], cfg["heading_font"][1])

        text = title.upper() if cfg["heading_caps"] else title
        pdf.drawString(left, y, text)
        y -= 15

        if cfg["draw_rule"]:
            pdf.setStrokeColor(cfg["accent"])
            pdf.line(left, y + 6, left + 140, y + 6)
            y -= 6  # extra spacing below heading divider

        pdf.setFillColor(colors.black)

    def draw_paragraph(text):
        nonlocal y

        pdf.setFont(cfg["body_font"][0], cfg["body_font"][1])
        for line in wrap_text(text, 92):
            y = draw_line_if_needed(pdf, y, cfg)
            pdf.drawString(left, y, line)
            y -= cfg["line_gap"]

        y -= 3

    def draw_skills(skills):
        nonlocal y

        if not skills:
            return

        style = cfg["skills_style"]
        pdf.setFont(cfg["body_font"][0], cfg["body_font"][1])

        if style == "bullets":
            y = draw_bullets(pdf, skills, y, cfg)

        elif style == "inline-dots":
            line = " • ".join(skills)
            for wrapped in wrap_text(line, 92):
                y = draw_line_if_needed(pdf, y, cfg)
                pdf.drawString(left, y, wrapped)
                y -= cfg["line_gap"]
            y -= 4

        elif style == "pipes":
            line = " | ".join(skills)
            for wrapped in wrap_text(line, 92):
                y = draw_line_if_needed(pdf, y, cfg)
                pdf.drawString(left, y, wrapped)
                y -= cfg["line_gap"]
            y -= 4

    # =====================================================
    # Professional Summary
    # =====================================================

    summary = resume_data.get("professional_summary", "")
    if summary:
        draw_heading("Professional Summary")
        draw_paragraph(summary)

    # =====================================================
    # Skills
    # =====================================================

    skills = resume_data.get("skills", [])
    if skills:
        draw_heading("Skills")
        draw_skills(skills)

    # =====================================================
    # Professional Experience
    # =====================================================

    experience = resume_data.get("professional_experience", [])
    if experience:
        draw_heading("Professional Experience")

        for role in experience:
            y = draw_line_if_needed(pdf, y, cfg)

            company = role.get("company", "")
            title = role.get("title", "")

            if cfg["role_layout"] == "company-first-inline":
                pdf.setFont(cfg["company_font"][0], cfg["company_font"][1])
                pdf.drawString(left, y, company)

                if title:
                    pdf.setFont(cfg["title_font"][0], cfg["title_font"][1])
                    pdf.drawString(left + 185, y, f"— {title}")

                y -= 15

            elif cfg["role_layout"] == "title-first":
                pdf.setFillColor(cfg["accent"])
                pdf.setFont(cfg["company_font"][0], cfg["company_font"][1])
                pdf.drawString(left, y, title)
                y -= 14

                pdf.setFillColor(colors.black)
                pdf.setFont(cfg["title_font"][0], cfg["title_font"][1])
                pdf.drawString(left, y, company)
                y -= 14

            elif cfg["role_layout"] == "stacked":
                pdf.setFillColor(cfg["accent"])
                pdf.setFont(cfg["company_font"][0], cfg["company_font"][1])
                pdf.drawString(left, y, company.upper())
                y -= 14

                pdf.setFillColor(colors.black)
                pdf.setFont(cfg["title_font"][0], cfg["title_font"][1])
                pdf.drawString(left, y, title)
                y -= 14

            y = draw_bullets(pdf, role.get("description", []), y, cfg)

    # =====================================================
    # Education
    # =====================================================

    education = resume_data.get("education", [])
    if education:
        draw_heading("Education")
        y = draw_bullets(pdf, education, y, cfg)

    # =====================================================
    # Certifications
    # =====================================================

    certifications = resume_data.get("certifications", [])
    if certifications:
        draw_heading("Certifications")
        y = draw_bullets(pdf, certifications, y, cfg)

    pdf.save()
    return file_path