"""Tests for schema validation and validators."""
import pytest
from models.schema import CVProfile, Contact, ExperienceItem


def _base_profile(**overrides):
    data = {
        "name": "Jane Doe",
        "title": "Software Engineer",
        "contact": {"email": "jane@example.com", "phone": "0600000000", "location": "France"},
        "summary": "Experienced engineer.",
        "experience": [],
        "education": [],
        "skills": ["Python", "Docker"],
        "certifications": [],
        "languages": [],
        "projects": [],
    }
    data.update(overrides)
    return data


def test_valid_profile():
    p = CVProfile(**_base_profile())
    assert p.name == "Jane Doe"


def test_summary_truncated_at_800():
    long = "x" * 900
    p = CVProfile(**_base_profile(summary=long))
    assert len(p.summary) == 800


def test_skills_capped_at_12_even():
    skills = [f"skill{i}" for i in range(15)]
    p = CVProfile(**_base_profile(skills=skills))
    assert len(p.skills) <= 12
    assert len(p.skills) % 2 == 0


def test_skills_always_even():
    skills = [f"skill{i}" for i in range(11)]
    p = CVProfile(**_base_profile(skills=skills))
    assert len(p.skills) % 2 == 0


def test_bullets_capped_at_6():
    bullets = [f"Did thing {i}" for i in range(10)]
    exp = ExperienceItem(
        company="ACME", title="Dev", location="Paris",
        start="Jan 2020", end="Present", bullets=bullets
    )
    assert len(exp.bullets) == 6


def test_github_optional():
    p = CVProfile(**_base_profile())
    assert p.contact.github == ""


def test_languages_optional():
    p = CVProfile(**_base_profile())
    assert p.languages == []
