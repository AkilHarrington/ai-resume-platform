from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware

from models.resume_models import ResumeRequest
from services.resume_service import generate_resume_content
from services.docx_service import create_resume_docx
from services.pdf_service import create_resume_pdf
from services.ats_service import calculate_ats_score

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
   allow_origins=[
    "http://127.0.0.1:5500",
    "http://localhost:5500",
    "null",
    "https://ai-resume-platform-1-da6p.onrender.com"
],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"message": "AI Resume Platform backend is running"}


@app.post("/generate-resume")
def generate_resume(data: ResumeRequest):
    resume_data = generate_resume_content(data)
    return {
        "message": "Resume generated",
        "resume": resume_data
    }


@app.post("/generate-resume-docx")
def generate_resume_docx(data: ResumeRequest):
    resume_data = generate_resume_content(data)
    file_path = create_resume_docx(resume_data)

    return FileResponse(
        path=file_path,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        filename="resume.docx"
    )


@app.post("/generate-resume-pdf")
def generate_resume_pdf(data: ResumeRequest):
    resume_data = generate_resume_content(data)
    file_path = create_resume_pdf(resume_data)

    return FileResponse(
        path=file_path,
        media_type="application/pdf",
        filename="resume.pdf"
    )


@app.post("/ats-score")
def ats_score(data: ResumeRequest):
    resume = generate_resume_content(data)
    ats = calculate_ats_score(resume, data.job_description)

    return {
        "resume": resume,
        "ats_analysis": ats
    }