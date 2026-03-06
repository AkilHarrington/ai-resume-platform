from pydantic import BaseModel

class ResumeRequest(BaseModel):
    name: str
    email: str
    phone: str
    location: str
    skills: str
    experience: str
    education: str
    certifications: str
    job_description: str