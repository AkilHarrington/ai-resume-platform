from typing import Optional
from pydantic import BaseModel


class CoverLetterRequest(BaseModel):
    resumeText: str
    jobDescription: Optional[str] = None
    companyName: Optional[str] = None
    candidateName: Optional[str] = None
