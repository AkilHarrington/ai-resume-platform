# =========================================================
# File: docx_service.py
# Purpose: Generate .docx resume files from parsed resume data
# Uses python-docx (already installed — used in upload parsing)
# =========================================================

import io
import re
import logging
from docx import Document
from docx.shared import Pt, RGBColor, Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

from services.resume_parser import parse_resume_text

_DATE_YEAR_RE = re.compile(r"\b(19|20)\d{2}\b")

logger = logging.getLogger("ai_resume_studio")

# ─── Template colour palettes ──────────────────────────────────────────────────

PALETTES = {
    "professional": {"accent": RGBColor(0x1A, 0x35, 0x6E), "heading": RGBColor(0x1A, 0x35, 0x6E)},
    "modern":       {"accent": RGBColor(0x00, 0x78, 0xD7), "heading": RGBColor(0x22, 0x22, 0x22)},
    "executive":    {"accent": RGBColor(0x1C, 0x3A, 0x2B), "heading": RGBColor(0x1C, 0x3A, 0x2B)},
}

GRAY = RGBColor(0x55, 0x55, 0x55)


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

    pPr = p._p.get_or_add_pPr()
    pBdr = OxmlElement("w:pBdr")
    bottom = OxmlElement("w:bottom")
    bottom.set(qn("w:val"), "single")
    bottom.set(qn("w:sz"), "4")
    bottom.set(qn("w:space"), "1")
    bottom.set(qn("w:color"), f"{color[0]:02X}{color[1]:02X}{color[2]:02X}")
    pBdr.append(bottom)
    pPr.append(pBdr)


def _add_contact_block(doc: Document, full_name: str, contact: dict, accent: RGBColor):
    """Render name + contact info centred at the top."""
    # Name
    name_p = doc.add_paragraph()
    name_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    name_p.paragraph_format.space_after = Pt(2)
    name_run = name_p.add_run(full_name or "")
    name_run.bold = True
    name_run.font.size = Pt(18)
    _set_run_color(name_run, accent)

    # Contact line — skip None/empty values
    parts = [
        v for v in (
            contact.get("email"),
            contact.get("phone"),
            contact.get("location"),
            contact.get("linkedin"),
        )
        if v
    ]
    if parts:
        c_p = doc.add_paragraph("  |  ".join(parts))
        c_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        c_p.paragraph_format.space_after = Pt(8)
        for run in c_p.runs:
            run.font.size = Pt(9)
            _set_run_color(run, GRAY)


def _render_experience_entry(doc: Document, job: dict):
    """Render one experience block: company/title header, date, bullets."""
    company = (job.get("company") or "").strip()
    title   = (job.get("title")   or "").strip()
    start   = (job.get("startDate") or "").strip()
    end     = (job.get("endDate")   or "").strip()
    bullets = job.get("bullets", [])

    # Company | Title
    if company or title:
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(6)
        p.paragraph_format.space_after = Pt(1)
        label = " | ".join(filter(None, [company, title]))
        run = p.add_run(label)
        run.bold = True
        run.font.size = Pt(10)

    # Date range
    if start or end:
        date_str = f"{start} – {end}" if (start and end) else (start or end)
        p2 = doc.add_paragraph()
        p2.paragraph_format.space_after = Pt(2)
        run2 = p2.add_run(date_str)
        run2.italic = True
        run2.font.size = Pt(9)
        _set_run_color(run2, GRAY)

    # Bullets
    for bullet in bullets:
        bullet = bullet.strip()
        if not bullet:
            continue
        p3 = doc.add_paragraph()
        p3.paragraph_format.space_after = Pt(1)
        p3.paragraph_format.left_indent = Inches(0.15)
        run3 = p3.add_run(f"• {bullet}")
        run3.font.size = Pt(10)


def _render_education_entry(doc: Document, edu: dict):
    """Render one education block: institution + degree."""
    institution = (edu.get("institution") or "").strip()
    degree      = (edu.get("degree")      or "").strip()
    grad_date   = (edu.get("graduationDate") or "").strip()

    if institution:
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(4)
        p.paragraph_format.space_after = Pt(1)
        run = p.add_run(institution)
        run.bold = True
        run.font.size = Pt(10)

    if degree:
        suffix = f"  ({grad_date})" if grad_date else ""
        p2 = doc.add_paragraph()
        p2.paragraph_format.space_after = Pt(2)
        run2 = p2.add_run(degree + suffix)
        run2.font.size = Pt(10)


def _render_raw_text(doc: Document, resume_text: str, heading_color: RGBColor):
    """
    Fallback renderer used when the structured parser extracts no sections.
    Applies minimal heuristics: ALL-CAPS short lines → section headings,
    bullet-prefixed lines → indented bullets, everything else → body text.
    """
    KNOWN_HEADINGS = {
        "summary", "professional summary", "experience", "professional experience",
        "work experience", "education", "skills", "core competencies",
        "certifications", "licenses",
    }
    for line in resume_text.split("\n"):
        stripped = line.strip()
        if not stripped:
            continue
        lower = stripped.lower()
        is_heading = (
            (stripped.isupper() and 3 < len(stripped) < 60)
            or lower in KNOWN_HEADINGS
        )
        if is_heading:
            _add_heading(doc, stripped, heading_color)
        elif stripped[0] in ("•", "-", "–", "*"):
            p = doc.add_paragraph()
            p.paragraph_format.space_after = Pt(1)
            p.paragraph_format.left_indent = Inches(0.15)
            run = p.add_run(stripped)
            run.font.size = Pt(10)
        else:
            p = doc.add_paragraph()
            p.paragraph_format.space_after = Pt(1)
            run = p.add_run(stripped)
            run.font.size = Pt(10)


def _post_process_experience(experience: list) -> list:
    """
    The parser sometimes mis-identifies a bare date line (e.g. "March 2021 – Present")
    as a new experience entry. Detect these and merge their bullets back into the
    previous real entry.
    """
    if not experience:
        return experience

    merged: list = []
    for entry in experience:
        company = (entry.get("company") or "").strip()
        title   = (entry.get("title")   or "").strip()
        bullets = entry.get("bullets", [])

        # A "date entry" has no title, its company string contains a year, and
        # includes a range separator or "Present" / "Current".
        is_date_entry = (
            not title
            and bool(_DATE_YEAR_RE.search(company))
            and any(tok in company for tok in ("–", "—", "-", "Present", "Current", "present", "current"))
        )

        if is_date_entry and merged:
            # Adopt the orphaned bullets into the previous real entry
            merged[-1]["bullets"] = merged[-1].get("bullets", []) + bullets
        else:
            merged.append(dict(entry))

    return merged


def generate_resume_docx(resume_text: str, template: str = "professional") -> bytes:
    """
    Parse resume_text and render it as a .docx file.
    Returns raw bytes suitable for an HTTP response.

    The parser (parse_resume_text) returns a flat dict:
        {
          "fullName":       str,
          "headline":       str,
          "contact":        {email, phone, location, linkedin, portfolio},
          "summary":        str,          # NOT a list
          "skills":         [str, ...],
          "experience":     [{company, title, startDate, endDate, bullets}, ...],
          "education":      [{institution, degree, graduationDate}, ...],
          "certifications": [{name, issuer, date}, ...],
        }
    Sections are top-level keys — there is no "sections" sub-dict.
    """
    template = template.lower().strip()
    if template not in PALETTES:
        template = "professional"

    palette = PALETTES[template]
    accent        = palette["accent"]
    heading_color = palette["heading"]

    resume_data = parse_resume_text(resume_text)

    full_name    = resume_data.get("fullName", "") or ""
    contact      = resume_data.get("contact", {})
    summary      = resume_data.get("summary", "") or ""
    skills       = resume_data.get("skills", []) or []
    experience   = _post_process_experience(resume_data.get("experience", []) or [])
    education    = resume_data.get("education", []) or []
    certifications = resume_data.get("certifications", []) or []

    has_content = bool(summary or skills or experience or education or certifications)

    # ── Build document ─────────────────────────────────────────────────────────
    doc = Document()

    for sec in doc.sections:
        sec.top_margin    = Inches(0.75)
        sec.bottom_margin = Inches(0.75)
        sec.left_margin   = Inches(0.85)
        sec.right_margin  = Inches(0.85)

    normal = doc.styles["Normal"]
    normal.font.name = "Calibri"
    normal.font.size = Pt(10)
    normal.paragraph_format.space_after = Pt(2)

    # Contact / name block
    _add_contact_block(doc, full_name, contact, accent)

    if not has_content:
        logger.warning(
            "generate_resume_docx: parser returned no structured sections — "
            "falling back to raw-text rendering"
        )
        _render_raw_text(doc, resume_text, heading_color)
    else:
        # ── Summary ────────────────────────────────────────────────────────────
        if summary:
            _add_heading(doc, "Professional Summary", heading_color)
            p = doc.add_paragraph()
            p.paragraph_format.space_after = Pt(4)
            run = p.add_run(summary)
            run.font.size = Pt(10)

        # ── Experience ─────────────────────────────────────────────────────────
        if experience:
            _add_heading(doc, "Experience", heading_color)
            for job in experience:
                if isinstance(job, dict):
                    _render_experience_entry(doc, job)

        # ── Education ──────────────────────────────────────────────────────────
        if education:
            _add_heading(doc, "Education", heading_color)
            for edu in education:
                if isinstance(edu, dict):
                    _render_education_entry(doc, edu)

        # ── Skills ─────────────────────────────────────────────────────────────
        if skills:
            _add_heading(doc, "Skills", heading_color)
            p = doc.add_paragraph()
            p.paragraph_format.space_after = Pt(4)
            run = p.add_run("  •  ".join(str(s) for s in skills if s))
            run.font.size = Pt(10)

        # ── Certifications ─────────────────────────────────────────────────────
        if certifications:
            _add_heading(doc, "Certifications", heading_color)
            for cert in certifications:
                name = (
                    cert.get("name", "") if isinstance(cert, dict) else str(cert)
                ).strip()
                if not name:
                    continue
                p = doc.add_paragraph()
                p.paragraph_format.space_after = Pt(1)
                run = p.add_run(f"• {name}")
                run.font.size = Pt(10)

    buf = io.BytesIO()
    doc.save(buf)
    logger.info(
        "generate_resume_docx: produced %d bytes (template=%s, structured=%s)",
        buf.tell(),
        template,
        has_content,
    )
    return buf.getvalue()
