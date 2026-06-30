# =============================================================================
# File: backend/services/pdf_service.py
# Purpose: ReportLab PDF generation — 3 resume templates + cover letter.
#          Replaces @react-pdf/renderer for consistent server-side rendering.
# =============================================================================

from io import BytesIO
from typing import Dict, List, Any
from xml.sax.saxutils import escape as _xml_escape

from reportlab.lib.pagesizes import LETTER
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor, white, black
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT, TA_JUSTIFY
from reportlab.platypus import (
    BaseDocTemplate, SimpleDocTemplate, Frame, PageTemplate,
    Paragraph, Spacer, Table, TableStyle, HRFlowable,
    FrameBreak, KeepTogether,
)

# ─── Colors ──────────────────────────────────────────────────────────────────
CHARCOAL    = HexColor('#2D2D2D')
GRAY_500    = HexColor('#6B7280')
GRAY_200    = HexColor('#E5E7EB')
GRAY_100    = HexColor('#F3F4F6')
SIDEBAR_TXT = HexColor('#CBD5E0')   # light slate for sidebar secondary text
WHITE       = white

PAGE_W, PAGE_H = LETTER  # 612 x 792 pt

# ─── Palette registry ─────────────────────────────────────────────────────────
# Each palette defines: accent (primary), accent_dark, accent_light, success_dot
PALETTES: Dict[str, Dict[str, Any]] = {
    "blue": {
        "accent":       HexColor('#1A365D'),
        "accent_dark":  HexColor('#0F2647'),
        "accent_light": HexColor('#EBF2FF'),
        "dot":          HexColor('#047857'),
    },
    "charcoal": {
        "accent":       HexColor('#1F2937'),
        "accent_dark":  HexColor('#111827'),
        "accent_light": HexColor('#F3F4F6'),
        "dot":          HexColor('#374151'),
    },
    "monochrome": {
        "accent":       HexColor('#000000'),
        "accent_dark":  HexColor('#000000'),
        "accent_light": HexColor('#F9FAFB'),
        "dot":          HexColor('#4B5563'),
    },
    "slate": {
        "accent":       HexColor('#334155'),
        "accent_dark":  HexColor('#1E293B'),
        "accent_light": HexColor('#F1F5F9'),
        "dot":          HexColor('#475569'),
    },
    "forest": {
        "accent":       HexColor('#14532D'),
        "accent_dark":  HexColor('#052E16'),
        "accent_light": HexColor('#F0FDF4'),
        "dot":          HexColor('#166534'),
    },
}

def _get_palette(palette: str) -> Dict[str, Any]:
    """Return palette dict, defaulting to 'blue' if unknown."""
    return PALETTES.get(palette.lower().strip(), PALETTES["blue"])


# =============================================================================
# PUBLIC ENTRY POINTS
# =============================================================================

def generate_resume_pdf(resume_data: Dict, template: str = "professional", palette: str = "blue") -> bytes:
    """
    Generate a resume PDF using ReportLab.

    Args:
        resume_data: Structured dict from parse_resume_text()
        template: "professional" | "modern" | "executive"

    Returns:
        PDF bytes
    """
    tpl = template.lower().strip()
    pal = _get_palette(palette)
    if tpl == "modern":
        return _build_modern(resume_data, pal)
    elif tpl == "executive":
        return _build_executive(resume_data, pal)
    else:
        return _build_professional(resume_data, pal)


def generate_cover_letter_pdf(cover_letter_text: str, company_name: str = "") -> bytes:
    """Generate a clean cover letter PDF from raw text."""
    return _build_cover_letter(cover_letter_text, company_name)


# =============================================================================
# PROFESSIONAL TEMPLATE
# Single column, ATS-safe, navy section banners, Helvetica.
# =============================================================================

_PROF_LM = 0.65 * inch
_PROF_RM = 0.65 * inch
_PROF_TM = 0.55 * inch
_PROF_BM = 0.50 * inch
_PROF_CW = PAGE_W - _PROF_LM - _PROF_RM   # 7.2"


def _prof_banner(title: str, pal: Dict) -> Table:
    """Full-width accent section header for Professional template."""
    style = ParagraphStyle(
        'ProfBanner',
        fontName='Helvetica-Bold', fontSize=7.5,
        textColor=WHITE, leading=9, spaceAfter=0,
    )
    t = Table([[Paragraph(title.upper(), style)]], colWidths=[_PROF_CW])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), pal["accent"]),
        ('LEFTPADDING',   (0, 0), (-1, -1), 6),
        ('RIGHTPADDING',  (0, 0), (-1, -1), 6),
        ('TOPPADDING',    (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    return t


def _prof_section(story: List, title: str, pal: Dict) -> None:
    story.append(Spacer(1, 9))
    story.append(_prof_banner(title, pal))
    story.append(Spacer(1, 6))


def _build_professional(data: Dict, pal: Dict) -> bytes:
    buf = BytesIO()
    doc = SimpleDocTemplate(
        buf, pagesize=LETTER,
        leftMargin=_PROF_LM, rightMargin=_PROF_RM,
        topMargin=_PROF_TM, bottomMargin=_PROF_BM,
    )

    # ── Styles ────────────────────────────────────────────────────────────────
    name_s = ParagraphStyle(
        'PName', fontName='Helvetica-Bold', fontSize=22,
        textColor=pal["accent"], leading=26, spaceAfter=3,
    )
    hl_s = ParagraphStyle(
        'PHL', fontName='Helvetica', fontSize=11,
        textColor=GRAY_500, leading=14, spaceAfter=3,
    )
    contact_s = ParagraphStyle(
        'PCon', fontName='Helvetica', fontSize=8.5,
        textColor=GRAY_500, leading=11, spaceAfter=5,
    )
    title_s = ParagraphStyle(
        'PJobTitle', fontName='Helvetica-Bold', fontSize=10,
        textColor=pal["accent"], leading=13,
    )
    dates_s = ParagraphStyle(
        'PDates', fontName='Helvetica', fontSize=8.5,
        textColor=GRAY_500, leading=13, alignment=TA_RIGHT,
    )
    company_s = ParagraphStyle(
        'PCo', fontName='Helvetica', fontSize=9.5,
        textColor=pal["dot"], leading=12, spaceAfter=2,
    )
    bullet_s = ParagraphStyle(
        'PBul', fontName='Helvetica', fontSize=9,
        textColor=CHARCOAL, leading=12.5, spaceAfter=2,
        leftIndent=12,
    )
    body_s = ParagraphStyle(
        'PBody', fontName='Helvetica', fontSize=9.5,
        textColor=CHARCOAL, leading=13.5, spaceAfter=4,
        alignment=TA_JUSTIFY,
    )
    skill_s = ParagraphStyle(
        'PSkill', fontName='Helvetica', fontSize=9.5,
        textColor=CHARCOAL, leading=13,
    )
    edu_inst_s = ParagraphStyle(
        'PEduInst', fontName='Helvetica-Bold', fontSize=10,
        textColor=pal["accent"], leading=13, spaceAfter=1,
    )
    edu_deg_s = ParagraphStyle(
        'PEduDeg', fontName='Helvetica', fontSize=9.5,
        textColor=CHARCOAL, leading=12, spaceAfter=5,
    )
    cert_s = ParagraphStyle(
        'PCert', fontName='Helvetica', fontSize=9.5,
        textColor=CHARCOAL, leading=12, spaceAfter=3,
    )

    story: List = []

    # Name
    story.append(Paragraph(_safe(data, 'fullName'), name_s))

    # Headline
    if data.get('headline'):
        story.append(Paragraph(_e(data['headline']), hl_s))

    # Contact row
    c = data.get('contact', {})
    parts = [p for p in [c.get('email'), c.get('phone'), c.get('location'), c.get('linkedin')] if p]
    if parts:
        story.append(Paragraph('   |   '.join(_e(p) for p in parts), contact_s))

    # Accent rule
    story.append(HRFlowable(width='100%', thickness=1.5, color=pal["dot"], spaceAfter=4, spaceBefore=2))

    # Summary
    if data.get('summary'):
        _prof_section(story, 'Professional Summary', pal)
        story.append(Paragraph(_e(data['summary']), body_s))

    # Experience
    if data.get('experience'):
        _prof_section(story, 'Professional Experience', pal)
        for job in data['experience']:
            title_txt = _e(job.get('title', ''))
            company_txt = _e(job.get('company', ''))
            start = _e(job.get('startDate', '') or '')
            end = _e(job.get('endDate', 'Present') or 'Present')
            date_txt = f"{start} – {end}" if start else end

            # Title + dates side-by-side
            title_row = Table(
                [[Paragraph(title_txt, title_s), Paragraph(date_txt, dates_s)]],
                colWidths=[_PROF_CW - 1.5 * inch, 1.5 * inch],
            )
            title_row.setStyle(TableStyle([
                ('VALIGN',        (0, 0), (-1, -1), 'TOP'),
                ('LEFTPADDING',   (0, 0), (-1, -1), 0),
                ('RIGHTPADDING',  (0, 0), (-1, -1), 0),
                ('TOPPADDING',    (0, 0), (-1, -1), 0),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
            ]))
            story.append(title_row)

            if company_txt:
                story.append(Paragraph(company_txt, company_s))

            for bullet in job.get('bullets', []):
                story.append(Paragraph(f"• {_e(bullet)}", bullet_s))

            story.append(Spacer(1, 5))

    # Skills
    if data.get('skills'):
        _prof_section(story, 'Skills', pal)
        skills_text = '   •   '.join(_e(s) for s in data['skills'])
        story.append(Paragraph(skills_text, skill_s))

    # Education
    if data.get('education'):
        _prof_section(story, 'Education', pal)
        for edu in data['education']:
            story.append(Paragraph(_e(edu.get('institution', '')), edu_inst_s))
            if edu.get('degree'):
                story.append(Paragraph(_e(edu['degree']), edu_deg_s))

    # Certifications
    if data.get('certifications'):
        _prof_section(story, 'Certifications', pal)
        for cert in data['certifications']:
            story.append(Paragraph(_e(cert.get('name', '')), cert_s))

    doc.build(story)
    return buf.getvalue()


# =============================================================================
# MODERN TEMPLATE
# Two-column: navy sidebar (contact/skills/edu) + white main (summary/experience).
# Uses BaseDocTemplate with two Frame objects and onPage canvas callback.
# =============================================================================

_MOD_SIDEBAR_W   = 2.10 * inch
_MOD_GUTTER      = 0.0          # sidebar bg painted by canvas — no gap needed
_MOD_MAIN_X      = _MOD_SIDEBAR_W
_MOD_MAIN_W      = PAGE_W - _MOD_SIDEBAR_W - 0.30 * inch
_MOD_SIDE_PAD_L  = 14
_MOD_SIDE_PAD_R  = 12
_MOD_SIDE_PAD_V  = 18
_MOD_MAIN_PAD_L  = 16
_MOD_MAIN_PAD_R  = 20
_MOD_MAIN_PAD_V  = 20
_MOD_SIDE_INNER  = _MOD_SIDEBAR_W - (_MOD_SIDE_PAD_L + _MOD_SIDE_PAD_R) / 72   # usable sidebar width in inches


def _mod_draw_bg(canvas, doc, pal: Dict):
    """Paint the accent sidebar background before every page."""
    canvas.saveState()
    canvas.setFillColor(pal["accent_dark"])
    canvas.rect(0, 0, _MOD_SIDEBAR_W, PAGE_H, fill=1, stroke=0)
    canvas.restoreState()


def _build_modern(data: Dict, pal: Dict) -> bytes:
    buf = BytesIO()

    sidebar_frame = Frame(
        0, 0, _MOD_SIDEBAR_W, PAGE_H,
        leftPadding=_MOD_SIDE_PAD_L, rightPadding=_MOD_SIDE_PAD_R,
        topPadding=_MOD_SIDE_PAD_V, bottomPadding=_MOD_SIDE_PAD_V,
        id='sidebar',
    )
    main_frame = Frame(
        _MOD_MAIN_X, 0, _MOD_MAIN_W, PAGE_H,
        leftPadding=_MOD_MAIN_PAD_L, rightPadding=_MOD_MAIN_PAD_R,
        topPadding=_MOD_MAIN_PAD_V, bottomPadding=_MOD_MAIN_PAD_V,
        id='main',
    )

    def _draw_bg(canvas, doc):
        _mod_draw_bg(canvas, doc, pal)

    page_template = PageTemplate(
        id='ModernPage',
        frames=[sidebar_frame, main_frame],
        onPage=_draw_bg,
    )

    doc = BaseDocTemplate(
        buf, pagesize=LETTER,
        pageTemplates=[page_template],
        leftMargin=0, rightMargin=0, topMargin=0, bottomMargin=0,
    )

    # ── Sidebar styles ────────────────────────────────────────────────────────
    s_name = ParagraphStyle(
        'SName', fontName='Helvetica-Bold', fontSize=15,
        textColor=WHITE, leading=18, spaceAfter=4,
    )
    s_hl = ParagraphStyle(
        'SHL', fontName='Helvetica', fontSize=8.5,
        textColor=SIDEBAR_TXT, leading=11, spaceAfter=10,
    )
    s_sec = ParagraphStyle(
        'SSec', fontName='Helvetica-Bold', fontSize=7.5,
        textColor=pal["accent_light"], leading=9, spaceAfter=5,
        spaceBefore=10,
    )
    s_contact = ParagraphStyle(
        'SCon', fontName='Helvetica', fontSize=8,
        textColor=SIDEBAR_TXT, leading=11, spaceAfter=2,
    )
    s_skill = ParagraphStyle(
        'SSkill', fontName='Helvetica', fontSize=8.5,
        textColor=WHITE, leading=12, spaceAfter=2,
    )
    s_edu_inst = ParagraphStyle(
        'SEduInst', fontName='Helvetica-Bold', fontSize=8.5,
        textColor=WHITE, leading=11, spaceAfter=1,
    )
    s_edu_deg = ParagraphStyle(
        'SEduDeg', fontName='Helvetica', fontSize=8,
        textColor=SIDEBAR_TXT, leading=10, spaceAfter=5,
    )
    s_cert = ParagraphStyle(
        'SCert', fontName='Helvetica', fontSize=8,
        textColor=SIDEBAR_TXT, leading=10, spaceAfter=3,
    )

    # ── Main styles ───────────────────────────────────────────────────────────
    m_sec = ParagraphStyle(
        'MSec', fontName='Helvetica-Bold', fontSize=10,
        textColor=pal["accent"], leading=12, spaceAfter=6, spaceBefore=12,
    )
    m_job_title = ParagraphStyle(
        'MJob', fontName='Helvetica-Bold', fontSize=10.5,
        textColor=pal["accent"], leading=13,
    )
    m_dates = ParagraphStyle(
        'MDates', fontName='Helvetica', fontSize=8.5,
        textColor=GRAY_500, leading=13, alignment=TA_RIGHT,
    )
    m_company = ParagraphStyle(
        'MCo', fontName='Helvetica', fontSize=9.5,
        textColor=pal["dot"], leading=12, spaceAfter=3,
    )
    m_bullet = ParagraphStyle(
        'MBul', fontName='Helvetica', fontSize=9,
        textColor=CHARCOAL, leading=12.5, spaceAfter=2, leftIndent=11,
    )
    m_body = ParagraphStyle(
        'MBody', fontName='Helvetica', fontSize=9.5,
        textColor=CHARCOAL, leading=13.5, spaceAfter=4, alignment=TA_JUSTIFY,
    )

    # ── Build sidebar story ───────────────────────────────────────────────────
    sidebar: List = []

    sidebar.append(Spacer(1, 4))
    sidebar.append(Paragraph(_safe(data, 'fullName'), s_name))
    if data.get('headline'):
        sidebar.append(Paragraph(_e(data['headline']), s_hl))

    # Contact
    c = data.get('contact', {})
    contact_items = [
        ('✉', c.get('email')),
        ('✆', c.get('phone')),
        ('⌖', c.get('location')),
        ('in', c.get('linkedin')),
    ]
    non_empty = [(icon, val) for icon, val in contact_items if val]
    if non_empty:
        sidebar.append(Paragraph('CONTACT', s_sec))
        for icon, val in non_empty:
            sidebar.append(Paragraph(f"{icon}  {_e(val)}", s_contact))

    # Skills
    if data.get('skills'):
        sidebar.append(Paragraph('SKILLS', s_sec))
        for skill in data['skills']:
            sidebar.append(Paragraph(f"• {_e(skill)}", s_skill))

    # Education
    if data.get('education'):
        sidebar.append(Paragraph('EDUCATION', s_sec))
        for edu in data['education']:
            sidebar.append(Paragraph(_e(edu.get('institution', '')), s_edu_inst))
            if edu.get('degree'):
                sidebar.append(Paragraph(_e(edu['degree']), s_edu_deg))

    # Certifications
    if data.get('certifications'):
        sidebar.append(Paragraph('CERTIFICATIONS', s_sec))
        for cert in data['certifications']:
            sidebar.append(Paragraph(_e(cert.get('name', '')), s_cert))

    # ── Build main story ──────────────────────────────────────────────────────
    main_items: List = []
    main_w = _MOD_MAIN_W - (_MOD_MAIN_PAD_L + _MOD_MAIN_PAD_R) / 72 * inch

    def _mod_section_header(title: str) -> None:
        main_items.append(Spacer(1, 4))
        hr = HRFlowable(width='100%', thickness=1, color=pal["dot"], spaceAfter=4)
        main_items.append(Paragraph(title.upper(), m_sec))
        main_items.append(hr)

    if data.get('summary'):
        _mod_section_header('Summary')
        main_items.append(Paragraph(_e(data['summary']), m_body))

    if data.get('experience'):
        _mod_section_header('Experience')
        for job in data['experience']:
            title_txt   = _e(job.get('title', ''))
            company_txt = _e(job.get('company', ''))
            start = _e(job.get('startDate', '') or '')
            end   = _e(job.get('endDate', 'Present') or 'Present')
            date_txt = f"{start} – {end}" if start else end

            job_row = Table(
                [[Paragraph(title_txt, m_job_title), Paragraph(date_txt, m_dates)]],
                colWidths=[None, 1.4 * inch],
            )
            job_row.setStyle(TableStyle([
                ('VALIGN',        (0, 0), (-1, -1), 'TOP'),
                ('LEFTPADDING',   (0, 0), (-1, -1), 0),
                ('RIGHTPADDING',  (0, 0), (-1, -1), 0),
                ('TOPPADDING',    (0, 0), (-1, -1), 0),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
            ]))
            main_items.append(job_row)

            if company_txt:
                main_items.append(Paragraph(company_txt, m_company))

            for bullet in job.get('bullets', []):
                main_items.append(Paragraph(f"• {_e(bullet)}", m_bullet))

            main_items.append(Spacer(1, 5))

    story = sidebar + [FrameBreak()] + main_items
    doc.build(story)
    return buf.getvalue()


# =============================================================================
# EXECUTIVE TEMPLATE
# Bold centered header drawn on canvas, emerald accent section bars.
# =============================================================================

_EXEC_LM      = 0.70 * inch
_EXEC_RM      = 0.70 * inch
_EXEC_BM      = 0.50 * inch
_EXEC_HDR_H   = 1.40 * inch   # height of the canvas-drawn navy header
_EXEC_TM      = _EXEC_HDR_H + 0.20 * inch
_EXEC_CW      = PAGE_W - _EXEC_LM - _EXEC_RM


def _exec_draw_header(canvas, doc, data: Dict, pal: Dict):
    """Draw the full-bleed accent header block on every page.
    Canvas drawString uses raw text — no XML escaping needed here."""
    canvas.saveState()

    # Accent fill
    canvas.setFillColor(pal["accent_dark"])
    canvas.rect(0, PAGE_H - _EXEC_HDR_H, PAGE_W, _EXEC_HDR_H, fill=1, stroke=0)

    # Accent stripe at bottom of header
    canvas.setFillColor(pal["dot"])
    canvas.rect(0, PAGE_H - _EXEC_HDR_H, PAGE_W, 3, fill=1, stroke=0)

    # Name
    canvas.setFillColor(WHITE)
    canvas.setFont('Helvetica-Bold', 23)
    name = _safe(data, 'fullName')
    canvas.drawCentredString(PAGE_W / 2, PAGE_H - 0.56 * inch, name)

    # Headline
    if data.get('headline'):
        canvas.setFillColor(pal["accent_light"])
        canvas.setFont('Helvetica', 11.5)
        canvas.drawCentredString(PAGE_W / 2, PAGE_H - 0.82 * inch, data['headline'])

    # Contact bar
    c = data.get('contact', {})
    parts = [p for p in [c.get('email'), c.get('phone'), c.get('location'), c.get('linkedin')] if p]
    if parts:
        canvas.setFillColor(HexColor('#A0AEC0'))
        canvas.setFont('Helvetica', 8)
        canvas.drawCentredString(PAGE_W / 2, PAGE_H - 1.10 * inch, '   |   '.join(parts))

    canvas.restoreState()


def _exec_section_header(title: str, pal: Dict) -> List:
    """Accent left-bar section header for Executive template."""
    bar_s = ParagraphStyle('ExecBar', fontName='Helvetica-Bold', fontSize=0.1, textColor=pal["dot"])
    txt_s = ParagraphStyle(
        'ExecSec', fontName='Helvetica-Bold', fontSize=10,
        textColor=pal["accent"], leading=12,
    )
    t = Table(
        [['', Paragraph(title.upper(), txt_s)]],
        colWidths=[5, _EXEC_CW - 5],
    )
    t.setStyle(TableStyle([
        ('BACKGROUND',    (0, 0), (0, 0), pal["dot"]),
        ('LEFTPADDING',   (0, 0), (0, 0), 0),
        ('RIGHTPADDING',  (0, 0), (0, 0), 0),
        ('LEFTPADDING',   (1, 0), (1, 0), 10),
        ('RIGHTPADDING',  (1, 0), (1, 0), 0),
        ('TOPPADDING',    (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('VALIGN',        (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    return [Spacer(1, 11), t, Spacer(1, 7)]


def _build_executive(data: Dict, pal: Dict) -> bytes:
    buf = BytesIO()

    # Partial-apply data and palette into the canvas callback
    def _on_page(canvas, doc):
        _exec_draw_header(canvas, doc, data, pal)

    doc = SimpleDocTemplate(
        buf, pagesize=LETTER,
        leftMargin=_EXEC_LM, rightMargin=_EXEC_RM,
        topMargin=_EXEC_TM, bottomMargin=_EXEC_BM,
    )

    # ── Styles ────────────────────────────────────────────────────────────────
    body_s = ParagraphStyle(
        'EBody', fontName='Helvetica', fontSize=10,
        textColor=CHARCOAL, leading=14, spaceAfter=4, alignment=TA_JUSTIFY,
    )
    job_title_s = ParagraphStyle(
        'EJob', fontName='Helvetica-Bold', fontSize=10.5,
        textColor=pal["accent"], leading=13,
    )
    dates_s = ParagraphStyle(
        'EDates', fontName='Helvetica', fontSize=9,
        textColor=GRAY_500, leading=13, alignment=TA_RIGHT,
    )
    company_s = ParagraphStyle(
        'ECo', fontName='Helvetica', fontSize=10,
        textColor=pal["dot"], leading=13, spaceAfter=3,
    )
    bullet_s = ParagraphStyle(
        'EBul', fontName='Helvetica', fontSize=9.5,
        textColor=CHARCOAL, leading=13.5, spaceAfter=2, leftIndent=14,
    )
    skill_s = ParagraphStyle(
        'ESkill', fontName='Helvetica', fontSize=10,
        textColor=CHARCOAL, leading=14,
    )
    edu_inst_s = ParagraphStyle(
        'EEduInst', fontName='Helvetica-Bold', fontSize=10.5,
        textColor=pal["accent"], leading=13, spaceAfter=1,
    )
    edu_deg_s = ParagraphStyle(
        'EEduDeg', fontName='Helvetica', fontSize=10,
        textColor=CHARCOAL, leading=13, spaceAfter=5,
    )
    cert_s = ParagraphStyle(
        'ECert', fontName='Helvetica', fontSize=10,
        textColor=CHARCOAL, leading=13, spaceAfter=3,
    )

    story: List = []

    # Summary
    if data.get('summary'):
        story += _exec_section_header('Executive Summary', pal)
        story.append(Paragraph(_e(data['summary']), body_s))

    # Experience
    if data.get('experience'):
        story += _exec_section_header('Professional Experience', pal)
        for job in data['experience']:
            title_txt   = _e(job.get('title', ''))
            company_txt = _e(job.get('company', ''))
            start = _e(job.get('startDate', '') or '')
            end   = _e(job.get('endDate', 'Present') or 'Present')
            date_txt = f"{start} – {end}" if start else end

            job_row = Table(
                [[Paragraph(title_txt, job_title_s), Paragraph(date_txt, dates_s)]],
                colWidths=[_EXEC_CW - 1.6 * inch, 1.6 * inch],
            )
            job_row.setStyle(TableStyle([
                ('VALIGN',        (0, 0), (-1, -1), 'TOP'),
                ('LEFTPADDING',   (0, 0), (-1, -1), 0),
                ('RIGHTPADDING',  (0, 0), (-1, -1), 0),
                ('TOPPADDING',    (0, 0), (-1, -1), 0),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
            ]))
            story.append(job_row)

            if company_txt:
                story.append(Paragraph(company_txt, company_s))

            for bullet in job.get('bullets', []):
                story.append(Paragraph(f"• {_e(bullet)}", bullet_s))

            story.append(Spacer(1, 6))

    # Skills
    if data.get('skills'):
        story += _exec_section_header('Core Competencies', pal)
        skills_text = '   •   '.join(_e(s) for s in data['skills'])
        story.append(Paragraph(skills_text, skill_s))

    # Education
    if data.get('education'):
        story += _exec_section_header('Education', pal)
        for edu in data['education']:
            story.append(Paragraph(_e(edu.get('institution', '')), edu_inst_s))
            if edu.get('degree'):
                story.append(Paragraph(_e(edu['degree']), edu_deg_s))

    # Certifications
    if data.get('certifications'):
        story += _exec_section_header('Certifications', pal)
        for cert in data['certifications']:
            story.append(Paragraph(_e(cert.get('name', '')), cert_s))

    # onFirstPage/onLaterPages must go into build(), not the constructor.
    # SimpleDocTemplate silently ignores them if passed as __init__ kwargs.
    doc.build(story, onFirstPage=_on_page, onLaterPages=_on_page)
    return buf.getvalue()


# =============================================================================
# COVER LETTER
# Clean single-column, company header, paragraphs.
# =============================================================================

def _build_cover_letter(text: str, company_name: str = "") -> bytes:
    buf = BytesIO()
    doc = SimpleDocTemplate(
        buf, pagesize=LETTER,
        leftMargin=0.9 * inch, rightMargin=0.9 * inch,
        topMargin=0.75 * inch, bottomMargin=0.75 * inch,
    )

    company_s = ParagraphStyle(
        'CLCo', fontName='Helvetica-Bold', fontSize=8.5,
        textColor=EMERALD, leading=10, spaceAfter=20,
        letterSpacing=1.5,
    )
    para_s = ParagraphStyle(
        'CLPara', fontName='Helvetica', fontSize=10.5,
        textColor=CHARCOAL, leading=17, spaceAfter=14, alignment=TA_JUSTIFY,
    )

    story: List = []

    if company_name:
        story.append(Paragraph(_e(company_name.upper()), company_s))

    paragraphs = [p.strip() for p in text.split('\n\n') if p.strip()]
    for p in paragraphs:
        # Collapse internal newlines to spaces (single-line bullets → space-separated)
        p_clean = ' '.join(line.strip() for line in p.splitlines() if line.strip())
        story.append(Paragraph(_e(p_clean), para_s))

    doc.build(story)
    return buf.getvalue()


# =============================================================================
# UTILITIES
# =============================================================================

def _e(text: str) -> str:
    """Escape XML special characters (&, <, >) for ReportLab Paragraph HTML parser.
    All user-supplied strings must pass through this before being passed to Paragraph().
    Canvas drawString calls do NOT need escaping — they render raw text."""
    return _xml_escape(str(text or ''))


def _safe(data: Dict, key: str, default: str = '') -> str:
    """Extract a string value from data dict and XML-escape it for Paragraph use."""
    return _e(data.get(key) or default)
