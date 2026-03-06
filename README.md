# AI Resume Platform

A local MVP resume builder that generates ATS-friendly resumes with AI, provides an ATS match score, and exports resumes as PDF and DOCX.

## Project Structure

- `frontend/` → static HTML, CSS, and JavaScript user interface
- `backend/` → FastAPI backend for AI generation, ATS scoring, and file exports

## Features

- Resume preview
- ATS match analysis
- PDF download
- DOCX download

## Local Development

### Run the backend

```bash
cd backend
source .venv/bin/activate
python -m uvicorn main:app --reload