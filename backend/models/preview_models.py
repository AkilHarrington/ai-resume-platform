from typing import Optional

from pydantic import BaseModel, Field

MAX_RESUME_CHARS = 50_000
MAX_JD_CHARS     = 30_000


class ResumePreviewRequest(BaseModel):
    resumeText:     str           = Field(..., max_length=MAX_RESUME_CHARS)
    jobDescription: Optional[str] = Field(None, max_length=MAX_JD_CHARS)
