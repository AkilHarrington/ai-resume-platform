from pydantic import BaseModel, Field

MAX_RESUME_CHARS = 50_000
MAX_JD_CHARS = 30_000


class SkillsFirstRequest(BaseModel):
    resumeText: str = Field(..., max_length=MAX_RESUME_CHARS)
    jobDescription: str = Field("", max_length=MAX_JD_CHARS)
    targetRole: str = Field("", max_length=200)
