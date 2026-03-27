"""Tests for the AI response validator."""
import json
import pytest
from services.validator import validate_cv


def _make_json(**overrides):
    base = {
        "name": "Test User",
        "title": "Engineer",
        "contact": {"email": "t@t.com", "phone": "000", "location": "France"},
        "summary": "Good engineer.",
        "experience": [],
        "education": [],
        "skills": ["Python", "Docker"],
        "certifications": [],
        "languages": [],
        "projects": [],
    }
    base.update(overrides)
    return json.dumps(base)


def test_valid_json_parses():
    profile = validate_cv(_make_json())
    assert profile.name == "Test User"


def test_strips_markdown_fences():
    raw = "```json\n" + _make_json() + "\n```"
    profile = validate_cv(raw)
    assert profile.name == "Test User"


def test_invalid_json_raises():
    with pytest.raises(ValueError, match="not valid JSON"):
        validate_cv("not json at all")


def test_skills_truncated():
    skills = [f"s{i}" for i in range(20)]
    profile = validate_cv(_make_json(skills=skills))
    assert len(profile.skills) <= 12


def test_bullets_truncated():
    exp = [{
        "company": "X", "title": "Dev", "location": "Paris",
        "start": "Jan 2020", "end": "Present",
        "bullets": [f"Did {i}" for i in range(10)],
    }]
    profile = validate_cv(_make_json(experience=exp))
    assert len(profile.experience[0].bullets) <= 6


def test_defaults_new_fields():
    """languages and projects default to [] if missing from AI response."""
    base = {
        "name": "X", "title": "Y",
        "contact": {"email": "a@b.com", "phone": "0", "location": "X"},
        "summary": "S", "experience": [], "education": [],
        "skills": ["A", "B"], "certifications": [],
    }
    profile = validate_cv(json.dumps(base))
    assert profile.languages == []
    assert profile.projects == []
