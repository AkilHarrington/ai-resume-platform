from pydantic import BaseModel


class ProfessionalSummaryRequest(BaseModel):
    resumeText: str
    targetRole: str = ""
    yearsExperience: str = ""


class BulletEnhanceRequest(BaseModel):
    bulletText: str
    targetRole: str = ""


class ResumeDocxRequest(BaseModel):
    resumeText: str
    template: str = "professional"
