from pathlib import Path
from textwrap import wrap

from reportlab.lib.pagesizes import LETTER
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas


def create_resume_pdf(resume_data: dict) -> str:
    output_dir = Path("generated")
    output_dir.mkdir(exist_ok=True)

    safe_name = resume_data.get("full_name", "resume").replace(" ", "_").lower()
    output_path = output_dir / f"{safe_name}_resume.pdf"

    c = canvas.Canvas(str(output_path), pagesize=LETTER)
    width, height = LETTER

    left_margin = 0.75 * inch
    right_margin = 0.75 * inch
    usable_width = width - left_margin - right_margin
    top_margin = height - 0.75 * inch
    bottom_margin = 0.75 * inch
    y = top_margin

    def new_page():
        nonlocal y
        c.showPage()
        y = top_margin

    def ensure_space(lines_needed=1, line_height=14):
        nonlocal y
        needed = lines_needed * line_height
        if y - needed < bottom_margin:
            new_page()

    def draw_wrapped_text(text, font_name="Helvetica", font_size=10, line_height=14, indent=0):
        nonlocal y
        if not text:
            return

        c.setFont(font_name, font_size)

        max_chars = 95 if indent == 0 else 88
        wrapped_lines = wrap(text, width=max_chars)

        ensure_space(len(wrapped_lines), line_height)

        for line in wrapped_lines:
            c.drawString(left_margin + indent, y, line)
            y -= line_height

    def draw_section_heading(text):
        nonlocal y
        ensure_space(2, 16)
        y -= 4
        c.setFont("Helvetica-Bold", 12)
        c.drawString(left_margin, y, text)
        y -= 16

    def draw_bullet(text):
        nonlocal y
        if not text:
            return

        wrapped_lines = wrap(text, width=84)
        ensure_space(len(wrapped_lines), 14)

        c.setFont("Helvetica", 10)

        first_line = True
        for line in wrapped_lines:
            if first_line:
                c.drawString(left_margin + 12, y, f"• {line}")
                first_line = False
            else:
                c.drawString(left_margin + 24, y, line)
            y -= 14

    # Header
    full_name = resume_data.get("full_name", "")
    if full_name:
        c.setFont("Helvetica-Bold", 16)
        c.drawString(left_margin, y, full_name)
        y -= 20

    contact_parts = []
    if resume_data.get("location"):
        contact_parts.append(resume_data["location"])
    if resume_data.get("phone"):
        contact_parts.append(resume_data["phone"])
    if resume_data.get("email"):
        contact_parts.append(resume_data["email"])

    if contact_parts:
        draw_wrapped_text(" | ".join(contact_parts), font_size=10, line_height=18)

    # Professional Summary
    if resume_data.get("professional_summary"):
        draw_section_heading("Professional Summary")
        draw_wrapped_text(resume_data["professional_summary"], line_height=15)

    # Skills
    skills = resume_data.get("skills", [])
    if skills:
        draw_section_heading("Skills")
        for skill in skills:
            draw_bullet(skill)

    # Professional Experience
    experience_items = resume_data.get("professional_experience", [])
    if experience_items:
        draw_section_heading("Professional Experience")
        for item in experience_items:
            company = item.get("company", "")
            title = item.get("title", "")
            heading = " — ".join(part for part in [company, title] if part)

            if heading:
                draw_wrapped_text(
                    heading,
                    font_name="Helvetica-Bold",
                    font_size=10,
                    line_height=16
                )

            for bullet in item.get("description", []):
                draw_bullet(bullet)

            y -= 4

    # Education
    education_items = resume_data.get("education", [])
    if education_items:
        draw_section_heading("Education")
        for entry in education_items:
            draw_bullet(entry)

    # Certifications
    certification_items = resume_data.get("certifications", [])
    if certification_items:
        draw_section_heading("Certifications")
        for entry in certification_items:
            draw_bullet(entry)

    c.save()
    return str(output_path)