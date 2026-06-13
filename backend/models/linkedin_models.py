from typing import Optional
from pydantic import BaseModel


class LinkedInRequest(BaseModel):
    resumeText: str
    jobDescription: Optional[str] = None
    targetRole: Optional[str] = None
