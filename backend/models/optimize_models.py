from typing import Optional

from pydantic import BaseModel


class ResumeOptimizeRequest(BaseModel):
    resumeText: str
    jobDescription: Optional[str] = None