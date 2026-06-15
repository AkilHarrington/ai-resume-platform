from typing import Optional

from pydantic import BaseModel, Field

# 50 000 chars ≈ 12 500 words — well above any real resume or JD
MAX_RESUME_CHARS = 50_000
MAX_JD_CHARS = 30_000


class ResumeScanRequest(BaseModel):
    resumeText: str = Field(..., max_length=MAX_RESUME_CHARS)
    jobDescription: Optional[str] = Field(None, max_length=MAX_JD_CHARS)
