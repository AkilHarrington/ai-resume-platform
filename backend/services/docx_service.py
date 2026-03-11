# =========================================================
# File: services/docx_service.py
# Purpose:
# Generate resume DOCX files from structured resume JSON.
#
# Responsibilities:
# - format resume content into a Word document
# - support multiple resume templates
# - apply typography, spacing, margins, and layout rules
# - save generated DOCX files for frontend download
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

from docx import Document
from docx.enum.text import WD_PARAGRAPH_ALIGNMENT
from docx.oxml.ns import qn
from docx.shared import Inches, Pt, RGBColor


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
# Document Setup Helpers
# =========================================================

def set_document_margins(document: Document, top=0.6, bottom=0.6, left=0.7, right=0.7):
    """
    Apply page margins to the first section of the DOCX document.
    """
    section = document.sections[0]
    section.top_margin = Inches(top)
    section.bottom_margin = Inches(bottom)
    section.left_margin = Inches(left)
    section.right_margin = Inches(right)


def set_default_font(document: Document, font_name="Arial", size=11):
    """
    Set the default font for the document's Normal style.
    """
    styles = document.styles
    normal_style = styles["Normal"]
    normal_style.font.name = font_name
    normal_style._element.rPr.rFonts.set(qn("w:eastAsia"), font_name)
    normal_style.font.size = Pt(size)


# =========================================================
# Template Configuration
# =========================================================

def get_template_config(template: str) -> dict:
    """
    Return layout and typography settings for each supported template.

    Supported templates:
    - professional
    - modern
    - executive
    """
    if template == "executive":
        return {
            "font_name": "Garamond",
            "body_size": 11.2,
            "name_size": 22,
            "subtitle_size": 11.5,
            "contact_size": 10.5,
            "heading_size": 12.8,
            "company_size": 12,
            "title_size": 11.2,
            "bullet_size": 10.9,
            "section_space_before": 16,
            "section_space_after": 6,
            "role_space_before": 10,
            "role_space_after": 2,
            "bullet_space_after": 3,
            "margins": (0.8, 0.8, 0.9, 0.9),
            "heading_caps": True,
            "heading_italic": False,
            "header_rule": True,
            "skills_style": "pipes",
            "role_layout": "stacked",
            "accent_rgb": (31, 41, 55),  # charcoal
            "divider_char": "━" * 26,
        }

    if template == "modern":
        return {
            "font_name": "Calibri",
            "body_size": 11,
            "name_size": 18,
            "subtitle_size": 11,
            "contact_size": 10,
            "heading_size": 11.8,
            "company_size": 11.4,
            "title_size": 10.8,
            "bullet_size": 10.7,
            "section_space_before": 13,
            "section_space_after": 5,
            "role_space_before": 9,
            "role_space_after": 2,
            "bullet_space_after": 4,
            "margins": (0.7, 0.7, 0.85, 0.85),
            "heading_caps": False,
            "heading_italic": True,
            "header_rule": True,
            "skills_style": "inline-dots",
            "role_layout": "title-first",
            "accent_rgb": (37, 99, 235),  # blue
            "divider_char": "─" * 22,
        }

    # Default = professional
    return {
        "font_name": "Arial",
        "body_size": 10.8,
        "name_size": 15.5,
        "subtitle_size": 10.8,
        "contact_size": 9.8,
        "heading_size": 11,
        "company_size": 11,
        "title_size": 10.4,
        "bullet_size": 10.4,
        "section_space_before": 10,
        "section_space_after": 4,
        "role_space_before": 6,
        "role_space_after": 1,
        "bullet_space_after": 2,
        "margins": (0.55, 0.55, 0.65, 0.65),
        "heading_caps": True,
        "heading_italic": False,
        "header_rule": False,
        "skills_style": "bullets",
        "role_layout": "company-first-inline",
        "accent_rgb": (0, 0, 0),
        "divider_char": "",
    }


# =========================================================
# Text / Styling Helpers
# =========================================================

def apply_color(run, rgb_tuple):
    """
    Apply RGB font color to a run.
    """
    run.font.color.rgb = RGBColor(*rgb_tuple)


def estimate_subtitle(resume_data: dict) -> str:
    """
    Use the first experience title as the subtitle when applicable.

    This is used by the modern and executive templates.
    """
    experience = resume_data.get("professional_experience", [])
    if experience and experience[0].get("title"):
        return experience[0]["title"]
    return ""


# =========================================================
# Header Builders
# =========================================================

def add_header(document: Document, resume_data: dict, config: dict, template: str):
    """
    Add the document header including:
    - full name
    - optional subtitle
    - contact line
    - optional divider
    """
    name = resume_data.get("full_name", "")
    subtitle = estimate_subtitle(resume_data)
    contact_parts = [
        resume_data.get("location", ""),
        resume_data.get("phone", ""),
        resume_data.get("email", ""),
    ]
    contact_line = " | ".join([p for p in contact_parts if p])

    # Candidate name
    p = document.add_paragraph()
    p.alignment = WD_PARAGRAPH_ALIGNMENT.CENTER
    p.paragraph_format.space_after = Pt(1)

    run = p.add_run(name)
    run.bold = True
    run.font.size = Pt(config["name_size"])
    apply_color(run, config["accent_rgb"])

    # Optional subtitle for modern / executive templates
    if template in ("modern", "executive") and subtitle:
        p = document.add_paragraph()
        p.alignment = WD_PARAGRAPH_ALIGNMENT.CENTER
        p.paragraph_format.space_after = Pt(2)

        run = p.add_run(subtitle)
        run.italic = template == "modern"
        run.font.size = Pt(config["subtitle_size"])
        apply_color(run, config["accent_rgb"])

    # Contact line
    p = document.add_paragraph()
    p.alignment = WD_PARAGRAPH_ALIGNMENT.CENTER
    p.paragraph_format.space_after = Pt(8 if template == "executive" else 6)

    run = p.add_run(contact_line)
    run.font.size = Pt(config["contact_size"])

    # Optional divider line
    if config["header_rule"]:
        p = document.add_paragraph()
        p.alignment = WD_PARAGRAPH_ALIGNMENT.CENTER
        p.paragraph_format.space_after = Pt(4 if template == "modern" else 6)

        run = p.add_run(config["divider_char"])
        run.font.size = Pt(9.5)
        apply_color(run, config["accent_rgb"])


# =========================================================
# Section Builders
# =========================================================

def add_section_heading(document: Document, title: str, config: dict):
    """
    Add a section heading with template-specific styling.
    """
    p = document.add_paragraph()
    p.alignment = WD_PARAGRAPH_ALIGNMENT.LEFT
    p.paragraph_format.space_before = Pt(config["section_space_before"])
    p.paragraph_format.space_after = Pt(config["section_space_after"])

    display_title = title.upper() if config["heading_caps"] else title

    run = p.add_run(display_title)
    run.bold = True
    run.italic = config["heading_italic"]
    run.font.size = Pt(config["heading_size"])
    apply_color(run, config["accent_rgb"])

    # Optional divider for templates that use section rules
    if config["header_rule"] and title != "Professional Summary":
        p = document.add_paragraph()
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(2)

        run = p.add_run(config["divider_char"])
        run.font.size = Pt(8.5)
        apply_color(run, config["accent_rgb"])


def add_paragraph_text(document: Document, text: str, config: dict):
    """
    Add a standard body paragraph.
    """
    p = document.add_paragraph()
    p.paragraph_format.space_after = Pt(5)

    run = p.add_run(text)
    run.font.size = Pt(config["body_size"])


# =========================================================
# Skills / Bullet Builders
# =========================================================

def add_skills(document: Document, skills: list[str], config: dict):
    """
    Render skills according to the selected template style.

    Supported styles:
    - bullets
    - inline-dots
    - pipes
    """
    if not skills:
        return

    style = config["skills_style"]

    if style == "bullets":
        for item in skills:
            p = document.add_paragraph(style="List Bullet")
            p.paragraph_format.space_after = Pt(config["bullet_space_after"])

            run = p.add_run(item)
            run.font.size = Pt(config["bullet_size"])
        return

    if style == "inline-dots":
        p = document.add_paragraph()
        p.paragraph_format.space_after = Pt(4)

        joined = " • ".join(skills)
        run = p.add_run(joined)
        run.font.size = Pt(config["body_size"])
        return

    if style == "pipes":
        p = document.add_paragraph()
        p.paragraph_format.space_after = Pt(4)

        joined = " | ".join(skills)
        run = p.add_run(joined)
        run.font.size = Pt(config["body_size"])
        return


def add_bullet_list(document: Document, items: list[str], config: dict):
    """
    Add a standard bullet list.
    """
    for item in items:
        p = document.add_paragraph(style="List Bullet")
        p.paragraph_format.space_after = Pt(config["bullet_space_after"])

        run = p.add_run(item)
        run.font.size = Pt(config["bullet_size"])


# =========================================================
# Experience / Role Builders
# =========================================================

def add_role(document: Document, role: dict, config: dict):
    """
    Render a single experience role using the selected template layout.

    Supported role layouts:
    - company-first-inline
    - title-first
    - stacked
    """
    company = role.get("company", "")
    title = role.get("title", "")
    layout = config["role_layout"]

    if layout == "company-first-inline":
        p = document.add_paragraph()
        p.paragraph_format.space_before = Pt(config["role_space_before"])
        p.paragraph_format.space_after = Pt(config["role_space_after"])

        company_run = p.add_run(company)
        company_run.bold = True
        company_run.font.size = Pt(config["company_size"])

        if title:
            title_run = p.add_run(f" — {title}")
            title_run.italic = True
            title_run.font.size = Pt(config["title_size"])

    elif layout == "title-first":
        p = document.add_paragraph()
        p.paragraph_format.space_before = Pt(config["role_space_before"])
        p.paragraph_format.space_after = Pt(0)

        title_run = p.add_run(title)
        title_run.bold = True
        title_run.font.size = Pt(config["company_size"])
        apply_color(title_run, config["accent_rgb"])

        p = document.add_paragraph()
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(config["role_space_after"])

        company_run = p.add_run(company)
        company_run.italic = True
        company_run.font.size = Pt(config["title_size"])

    elif layout == "stacked":
        p = document.add_paragraph()
        p.paragraph_format.space_before = Pt(config["role_space_before"])
        p.paragraph_format.space_after = Pt(0)

        company_run = p.add_run(company.upper())
        company_run.bold = True
        company_run.font.size = Pt(config["company_size"])
        apply_color(company_run, config["accent_rgb"])

        p = document.add_paragraph()
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(config["role_space_after"])

        title_run = p.add_run(title)
        title_run.italic = True
        title_run.font.size = Pt(config["title_size"])

    add_bullet_list(document, role.get("description", []), config)


# =========================================================
# Main DOCX Export Entry Point
# =========================================================

def create_resume_docx(resume_data: dict, template: str = "professional") -> str:
    """
    Create a DOCX resume file from structured resume JSON and return the file path.

    Flow:
    1. Create output folder if needed
    2. Build document
    3. Apply selected template config
    4. Render all resume sections
    5. Save document to generated directory
    """
    os.makedirs(GENERATED_DIR, exist_ok=True)

    filename = f"{safe_filename(resume_data.get('full_name', 'resume'))}_{template}_resume.docx"
    file_path = os.path.join(GENERATED_DIR, filename)

    document = Document()
    config = get_template_config(template)

    # Apply page setup
    top, bottom, left, right = config["margins"]
    set_document_margins(document, top, bottom, left, right)
    set_default_font(document, config["font_name"], config["body_size"])

    # Header
    add_header(document, resume_data, config, template)

    # Professional Summary
    summary = resume_data.get("professional_summary", "")
    if summary:
        add_section_heading(document, "Professional Summary", config)
        add_paragraph_text(document, summary, config)

    # Skills
    skills = resume_data.get("skills", [])
    if skills:
        add_section_heading(document, "Skills", config)
        add_skills(document, skills, config)

    # Professional Experience
    experience = resume_data.get("professional_experience", [])
    if experience:
        add_section_heading(document, "Professional Experience", config)
        for role in experience:
            add_role(document, role, config)

    # Education
    education = resume_data.get("education", [])
    if education:
        add_section_heading(document, "Education", config)
        add_bullet_list(document, education, config)

    # Certifications
    certifications = resume_data.get("certifications", [])
    if certifications:
        add_section_heading(document, "Certifications", config)
        add_bullet_list(document, certifications, config)

    document.save(file_path)
    return file_path