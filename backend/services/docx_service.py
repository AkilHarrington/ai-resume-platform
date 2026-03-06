from pathlib import Path

from docx import Document
from docx.enum.text import WD_PARAGRAPH_ALIGNMENT
from docx.shared import Pt


def create_resume_docx(resume_data: dict) -> str:
    output_dir = Path("generated")
    output_dir.mkdir(exist_ok=True)

    safe_name = resume_data.get("full_name", "resume").replace(" ", "_").lower()
    output_path = output_dir / f"{safe_name}_resume.docx"

    document = Document()

    # Base style
    normal_style = document.styles["Normal"]
    normal_style.font.name = "Arial"
    normal_style.font.size = Pt(10.5)

    # Header - Name
    full_name = resume_data.get("full_name", "")
    if full_name:
        p = document.add_paragraph()
        p.alignment = WD_PARAGRAPH_ALIGNMENT.CENTER
        p.paragraph_format.space_after = Pt(4)
        run = p.add_run(full_name)
        run.bold = True
        run.font.size = Pt(18)

    # Contact line
    contact_parts = []
    if resume_data.get("location"):
        contact_parts.append(resume_data["location"])
    if resume_data.get("phone"):
        contact_parts.append(resume_data["phone"])
    if resume_data.get("email"):
        contact_parts.append(resume_data["email"])

    if contact_parts:
        p = document.add_paragraph()
        p.alignment = WD_PARAGRAPH_ALIGNMENT.CENTER
        p.paragraph_format.space_after = Pt(10)
        run = p.add_run(" | ".join(contact_parts))
        run.font.size = Pt(10)

    def add_heading(text):
        p = document.add_paragraph()
        p.paragraph_format.space_before = Pt(8)
        p.paragraph_format.space_after = Pt(4)
        run = p.add_run(text.upper())
        run.bold = True
        run.font.size = Pt(11)

    # Professional Summary
    if resume_data.get("professional_summary"):
        add_heading("Professional Summary")
        p = document.add_paragraph(resume_data["professional_summary"])
        p.paragraph_format.space_after = Pt(6)

    # Skills
    skills = resume_data.get("skills", [])
    if skills:
        add_heading("Skills")
        for skill in skills:
            p = document.add_paragraph(style="List Bullet")
            p.paragraph_format.space_after = Pt(0)
            p.add_run(skill)

    # Professional Experience
    experience_items = resume_data.get("professional_experience", [])
    if experience_items:
        add_heading("Professional Experience")

        for item in experience_items:
            company = item.get("company", "")
            title = item.get("title", "")

            if company or title:
                p = document.add_paragraph()
                p.paragraph_format.space_after = Pt(2)

                if company:
                    run_company = p.add_run(company)
                    run_company.bold = True

                if company and title:
                    p.add_run(" — ")

                if title:
                    run_title = p.add_run(title)
                    run_title.italic = True

            for bullet_text in item.get("description", []):
                p = document.add_paragraph(style="List Bullet")
                p.paragraph_format.space_after = Pt(0)
                p.add_run(bullet_text)

    # Education
    education_items = resume_data.get("education", [])
    if education_items:
        add_heading("Education")
        for entry in education_items:
            p = document.add_paragraph(style="List Bullet")
            p.paragraph_format.space_after = Pt(0)
            p.add_run(entry)

    # Certifications
    certification_items = resume_data.get("certifications", [])
    if certification_items:
        add_heading("Certifications")
        for entry in certification_items:
            p = document.add_paragraph(style="List Bullet")
            p.paragraph_format.space_after = Pt(0)
            p.add_run(entry)

    document.save(output_path)
    return str(output_path)