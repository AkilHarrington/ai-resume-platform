from pydantic import BaseModel, Field

MAX_RESUME_CHARS = 50_000
MAX_JD_CHARS = 30_000
MAX_BULLET_CHARS = 2_000
MAX_SHORT_FIELD_CHARS = 200
MAX_TEMPLATE_CHARS = 50


class ProfessionalSummaryRequest(BaseModel):
    resumeText: str = Field(..., max_length=MAX_RESUME_CHARS)
    targetRole: str = Field("", max_length=MAX_SHORT_FIELD_CHARS)
    yearsExperience: str = Field("", max_length=MAX_SHORT_FIELD_CHARS)


class BulletEnhanceRequest(BaseModel):
    bulletText: str = Field(..., max_length=MAX_BULLET_CHARS)
    targetRole: str = Field("", max_length=MAX_SHORT_FIELD_CHARS)


class ResumeDocxRequest(BaseModel):
    resumeText: str = Field(..., max_length=MAX_RESUME_CHARS)
    template: str = Field("professional", max_length=MAX_TEMPLATE_CHARS)
