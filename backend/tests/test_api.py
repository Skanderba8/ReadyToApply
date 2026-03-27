"""Integration tests for the FastAPI endpoints (no LLM calls)."""
import io
import json
import pytest
from unittest.mock import patch, MagicMock
from httpx import AsyncClient, ASGITransport

# Patch env before importing app
import os
os.environ.setdefault("GROQ_API_KEY", "test-key")

from main import app


MOCK_PROFILE = {
    "name": "Jane Doe", "title": "Engineer",
    "contact": {"email": "j@j.com", "phone": "000", "location": "France"},
    "summary": "Good engineer with 5 years experience in Python and cloud.",
    "experience": [{
        "company": "ACME", "title": "Engineer", "location": "Paris",
        "start": "Jan 2020", "end": "Present",
        "bullets": ["Built API serving 1M requests/day.", "Reduced latency by 30%."],
    }],
    "education": [{"institution": "MIT", "degree": "BSc", "field": "CS", "year": "2019"}],
    "skills": ["Python", "Docker", "AWS", "FastAPI", "PostgreSQL", "Redis",
               "Kubernetes", "Terraform", "CI/CD", "Linux"],
    "certifications": [],
    "languages": [{"language": "English", "level": "Native"}],
    "projects": [],
}


@pytest.mark.asyncio
async def test_health():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        r = await client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


@pytest.mark.asyncio
async def test_generate_returns_docx():
    """generate endpoint returns a .docx file when given valid CV data."""
    with patch("services.tailor.tailor_cv") as mock_tailor:
        from models.schema import CVProfile
        mock_tailor.return_value = CVProfile(**MOCK_PROFILE)

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            r = await client.post("/generate", data={
                "cv_data": json.dumps(MOCK_PROFILE),
                "job_description": "We need a Python engineer with cloud experience.",
                "template": "classic",
            })

    assert r.status_code == 200
    assert "docx" in r.headers["content-type"]


@pytest.mark.asyncio
async def test_generate_invalid_cv_data():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        r = await client.post("/generate", data={
            "cv_data": "not valid json",
            "job_description": "Some job description here.",
        })
    assert r.status_code == 422


@pytest.mark.asyncio
async def test_generate_empty_job_description():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        r = await client.post("/generate", data={
            "cv_data": json.dumps(MOCK_PROFILE),
            "job_description": "   ",
        })
    assert r.status_code == 422


@pytest.mark.asyncio
async def test_review_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        r = await client.post("/review", json={"stars": 5, "comment": "Great tool!"})
    assert r.status_code == 200
    assert r.json()["ok"] is True


@pytest.mark.asyncio
async def test_review_invalid_stars():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        r = await client.post("/review", json={"stars": 10})
    assert r.status_code == 422
