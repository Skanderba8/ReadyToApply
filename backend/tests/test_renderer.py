"""Tests for the CV renderer — checks output is valid docx bytes."""
import pytest
from models.schema import CVProfile
from services.renderer import render_cv


PROFILE = CVProfile(**{
    "name": "Jane Doe", "title": "Software Engineer",
    "contact": {"email": "j@j.com", "phone": "000", "location": "France",
                "linkedin": "https://linkedin.com/in/jane", "github": ""},
    "summary": "Experienced engineer with 5 years in Python and cloud infrastructure.",
    "experience": [{
        "company": "ACME", "title": "Engineer", "location": "Paris",
        "start": "Jan 2020", "end": "Present",
        "bullets": ["Built API serving 1M requests/day.", "Reduced latency by 30%."],
    }],
    "education": [{"institution": "MIT", "degree": "BSc", "field": "CS", "year": "2019"}],
    "skills": ["Python", "Docker", "AWS", "FastAPI", "PostgreSQL", "Redis",
               "Kubernetes", "Terraform", "CI/CD", "Linux"],
    "certifications": [{"name": "AWS SAA", "issuer": "Amazon", "year": "2022"}],
    "languages": [{"language": "English", "level": "Native"},
                  {"language": "French", "level": "Fluent"}],
    "projects": [{"name": "MyApp", "description": "A cool app.", "url": "", "year": "2023"}],
})


@pytest.mark.parametrize("template", ["classic", "modern", "compact"])
def test_render_returns_bytes(template):
    result = render_cv(PROFILE, template_name=template)
    assert isinstance(result, bytes)
    assert len(result) > 1000  # non-trivial docx


@pytest.mark.parametrize("template", ["classic", "modern", "compact"])
def test_render_is_valid_docx(template):
    """Valid docx files start with the PK zip magic bytes."""
    result = render_cv(PROFILE, template_name=template)
    assert result[:2] == b"PK"


def test_render_unknown_template_falls_back_to_classic():
    result = render_cv(PROFILE, template_name="nonexistent")
    assert isinstance(result, bytes)
    assert result[:2] == b"PK"


def test_render_odd_skills_doesnt_crash():
    """Odd number of skills should not raise."""
    import copy
    p = PROFILE.model_copy(update={"skills": ["Python", "Docker", "AWS"]})
    result = render_cv(p, template_name="classic")
    assert result[:2] == b"PK"
