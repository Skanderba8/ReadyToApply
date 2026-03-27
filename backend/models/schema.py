from pydantic import BaseModel, field_validator
from typing import Optional

class Contact(BaseModel):
    email: str
    phone: str
    location: str
    linkedin: Optional[str] = ""
    github: Optional[str] = ""

class ExperienceItem(BaseModel):
    company: str
    title: str
    location: str
    start: str
    end: str
    bullets: list[str]

    @field_validator("bullets")
    @classmethod
    def max_six_bullets(cls, v):
        return v[:6]

class EducationItem(BaseModel):
    institution: str
    degree: str
    field: str
    year: str

class Certification(BaseModel):
    name: str
    issuer: str
    year: str

class LanguageItem(BaseModel):
    language: str
    level: str  # e.g. "Native", "Fluent", "Professional", "Intermediate", "Basic"

class ProjectItem(BaseModel):
    name: str
    description: str
    url: Optional[str] = ""
    year: Optional[str] = ""

class CVProfile(BaseModel):
    name: str
    title: str
    contact: Contact
    summary: str
    experience: list[ExperienceItem]
    education: list[EducationItem]
    skills: list[str]
    certifications: list[Certification]
    languages: Optional[list[LanguageItem]] = []
    projects: Optional[list[ProjectItem]] = []

    @field_validator("summary")
    @classmethod
    def summary_max_length(cls, v):
        return v[:800]

    @field_validator("skills")
    @classmethod
    def max_twelve_skills(cls, v):
        trimmed = v[:12]
        # Always keep an even count
        if len(trimmed) % 2 != 0:
            trimmed = trimmed[:-1]
        return trimmed
