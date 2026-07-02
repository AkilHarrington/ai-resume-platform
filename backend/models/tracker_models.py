from typing import Optional
from pydantic import BaseModel, Field


class JobApplicationCreate(BaseModel):
    company: str = Field(..., max_length=200)
    role: str = Field(..., max_length=200)
    status: str = Field("saved", max_length=50)
    url: Optional[str] = Field(None, max_length=500)
    applied_date: Optional[str] = Field(None)   # ISO date string "YYYY-MM-DD" or None
    location: Optional[str] = Field(None, max_length=200)
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    notes: Optional[str] = Field(None, max_length=5000)


class JobApplicationUpdate(BaseModel):
    company: Optional[str] = Field(None, max_length=200)
    role: Optional[str] = Field(None, max_length=200)
    status: Optional[str] = Field(None, max_length=50)
    url: Optional[str] = Field(None, max_length=500)
    applied_date: Optional[str] = Field(None)
    location: Optional[str] = Field(None, max_length=200)
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    notes: Optional[str] = Field(None, max_length=5000)
