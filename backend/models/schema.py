from pydantic import BaseModel, field_validator
from typing import Optional

class Contact(BaseModel):
    email: str
    phone: str
    location: str
    linkedin: Optional[str] = ""

class ExperienceItem(BaseModel):
    company: str
    title: str
    location: str
    start: str
    end: str
    bullets: list[str]

    @field_validator("bullets")
    @classmethod
    def max_four_bullets(cls, v):
        if len(v) > 4:
            raise ValueError("Max 4 bullets per role")
        return v

class EducationItem(BaseModel):
    institution: str
    degree: str
    field: str
    year: str

class Certification(BaseModel):
    name: str
    issuer: str
    year: str

class CVProfile(BaseModel):
    name: str
    title: str
    contact: Contact
    summary: str
    experience: list[ExperienceItem]
    education: list[EducationItem]
    skills: list[str]
    certifications: list[Certification]

    @field_validator("summary")
    @classmethod
    def summary_max_length(cls, v):
        if len(v) > 400:
            raise ValueError("Summary must be 400 characters or fewer")
        return v

    @field_validator("skills")
    @classmethod
    def max_twelve_skills(cls, v):
        if len(v) > 12:
            raise ValueError("Max 12 skills")
        return v