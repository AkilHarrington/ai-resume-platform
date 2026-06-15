from typing import Optional
from pydantic import BaseModel, Field

MAX_RESUME_CHARS = 50_000
MAX_JD_CHARS = 30_000
MAX_SHORT_FIELD_CHARS = 200


class LinkedInRequest(BaseModel):
    resumeText: str = Field(..., max_length=MAX_RESUME_CHARS)
    jobDescription: Optional[str] = Field(None, max_length=MAX_JD_CHARS)
    targetRole: Optional[str] = Field(None, max_length=MAX_SHORT_FIELD_CHARS)
