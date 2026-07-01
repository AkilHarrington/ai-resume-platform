# =========================================================
# File: docx_service.py
# Purpose: Generate .docx resume files from parsed resume data
# Uses python-docx (already installed — used in upload parsing)
# =========================================================

import io
import logging
from docx import Document
from docx.shared import Pt, RGBColor, Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH

from services.resume_parser import parse_resume_text

logger = logging.getLogger("ai_resume_studio")

# ─── Template colour palettes ──────────────────────────────────────────────────

PALETTES = {
    "professional": {"accent": RGBColor(0x1A, 0x35, 0x6E), "heading": RGBColor(0x1A, 0x35, 0x6E)},
    "modern":       {"accent": RGBColor(0x00, 0x78, 0xD7), "heading": RGBColor(0x22, 0x22, 0x22)},
    "executive":    {"accent": RGBColor(0x1C, 0x3A, 0x2B), "heading": RGBColor(0x1C, 0x3A, 0x2B)},
}


def _set_run_color(run, color: RGBColor):
    run.font.color.rgb = color


def _add_heading(doc: Document, text: str, color: RGBColor):
    """Add a section heading with a bottom border line."""
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(12)
    p.paragraph_format.space_after = Pt(2)
    run = p.add_run(text.upper())
    run.bold = True
    run.font.size = Pt(10)
    _set_run_color(run, color)

    # Thin bottom border via paragraph border XML
    from docx.oxml.ns import qn
    from docx.oxml import OxmlElement
    pPr = p._p.get_or_add_pPr()
    pBdr = OxmlElement("w:pBdr")
    bottom = OxmlElement("w:bottom")
    bottom.set(qn("w:val"), "single")
    bottom.set(qn("w:sz"), "4")
    bottom.set(qn("w:space"), "1")
    bottom.set(qn("w:color"), f"{color[0]:02X}{color[1]:02X}{color[2]:02X}")
    pBdr.append(bottom)
    pPr.append(pBdr)


def _add_contact_line(doc: Document, contact: dict, accent: RGBColor):
    """Name + contact info block."""
    name_p = doc.add_paragraph()
    name_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    name_p.paragraph_format.space_after = Pt(2)
    name_run = name_p.add_run(contact.get("name", ""))
    name_run.bold = True
    name_run.font.size = Pt(18)
    _set_run_color(name_run, accent)

    parts = [v for k in ("email", "phone", "location", "linkedin") if (v := contact.get(k))]
    if parts:
        contact_p = doc.add_paragraph("  |  ".join(parts))
        contact_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        contact_p.paragraph_format.space_after = Pt(8)
        for run in contact_p.runs:
            run.font.size = Pt(9)
            _set_run_color(run, RGBColor(0x44, 0x44, 0x44))


def generate_resume_docx(resume_text: str, template: str = "professional") -> bytes:
    """
    Parse resume_text and render it as a .docx file.
    Returns raw bytes suitable for an HTTP response.
    """
    template = template.lower().strip()
    if template not in PALETTES:
        template = "professional"

    palette = PALETTES[template]
    accent  = palette["accent"]
    heading_color = palette["heading"]

    resume_data = parse_resume_text(resume_text)
    contact = resume_data.get("contact", {})
    sections: dict = resume_data.get("sections", {})

    doc = Document()

    # ── Page margins ──────────────────────────────────────────────────────────
    for section in doc.sections:
        section.top_margin    = Inches(0.75)
        section.bottom_margin = Inches(0.75)
        section.left_margin   = Inches(0.85)
        section.right_margin  = Inches(0.85)

    # ── Default paragraph style ───────────────────────────────────────────────
    style = doc.styles["Normal"]
    style.font.name = "Calibri"
    style.font.size = Pt(10)
    style.paragraph_format.space_after = Pt(2)

    # ── Contact block ─────────────────────────────────────────────────────────
    _add_contact_line(doc, contact, accent)

    # ── Ordered section rendering ─────────────────────────────────────────────
    SECTION_ORDER = ["summary", "experience", "education", "skills", "certifications"]
    rendered = set()

    for key in SECTION_ORDER:
        lines = sections.get(key, [])
        if not lines:
            continue
        rendered.add(key)
        label = {
            "summary": "Professional Summary",
            "experience": "Experience",
            "education": "Education",
            "skills": "Skills",
            "certifications": "Certifications",
        }.get(key, key.title())
        _add_heading(doc, label, heading_color)
        for line in lines:
            line = line.strip()
            if not line:
                continue
            p = doc.add_paragraph()
            p.paragraph_format.space_after = Pt(1)
            if line.startswith(("•", "-", "–", "*")):
                p.style = doc.styles["List Bullet"] if "List Bullet" in [s.name for s in doc.styles] else doc.styles["Normal"]
                run = p.add_run(line.lstrip("•-–* ").strip())
            else:
                run = p.add_run(line)
            run.font.size = Pt(10)

    # ── Any remaining sections not in SECTION_ORDER ──────────────────────────
    for key, lines in sections.items():
        if key in rendered or not lines:
            continue
        _add_heading(doc, key.title(), heading_color)
        for line in lines:
            line = line.strip()
            if not line:
                continue
            p = doc.add_paragraph()
            p.paragraph_format.space_after = Pt(1)
            run = p.add_run(line.lstrip("•-–* ").strip())
            run.font.size = Pt(10)

    buf = io.BytesIO()
    doc.save(buf)
    return buf.getvalue()
