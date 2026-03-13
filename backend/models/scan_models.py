from typing import Optional

from pydantic import BaseModel


class ResumeScanRequest(BaseModel):
    resumeText: str
    jobDescription: Optional[str] = None