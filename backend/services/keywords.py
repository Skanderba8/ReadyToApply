"""
Local keyword extractor — no API call.
Uses a curated word list to pull technical/industry terms from the job description.
Soft skills are extracted via a simple pattern match.
Good enough to feed into the tailor prompt.
"""

import re

_TECHNICAL = {
    # Languages
    "python", "javascript", "typescript", "java", "kotlin", "swift", "go", "golang",
    "rust", "c++", "c#", "ruby", "php", "scala", "r", "matlab", "bash", "sql",
    # Frontend
    "react", "next.js", "nextjs", "vue", "angular", "svelte", "html", "css",
    "tailwind", "sass", "webpack", "vite",
    # Backend
    "node.js", "nodejs", "fastapi", "django", "flask", "express", "spring", "rails",
    "graphql", "rest", "grpc",
    # Data / ML
    "pytorch", "tensorflow", "keras", "scikit-learn", "pandas", "numpy", "spark",
    "hadoop", "airflow", "dbt", "mlflow", "hugging face", "llm", "rag",
    # Cloud / Infra
    "aws", "gcp", "azure", "docker", "kubernetes", "terraform", "ansible",
    "ci/cd", "github actions", "jenkins", "linux", "nginx",
    # Databases
    "postgresql", "mysql", "mongodb", "redis", "elasticsearch", "dynamodb",
    "supabase", "firebase", "snowflake", "bigquery",
    # Practices
    "agile", "scrum", "tdd", "bdd", "microservices", "devops", "mlops",
    "api", "oauth", "jwt", "websocket",
}

_SOFT = {
    "communication", "teamwork", "leadership", "problem-solving", "adaptability",
    "collaboration", "time management", "critical thinking", "creativity",
    "attention to detail", "autonomy", "initiative",
}

_INDUSTRY = {
    "fintech", "saas", "b2b", "b2c", "e-commerce", "healthtech", "edtech",
    "cybersecurity", "blockchain", "iot", "embedded", "data engineering",
    "machine learning", "artificial intelligence", "nlp", "computer vision",
    "product management", "ux", "ui", "seo", "erp", "crm",
    "iso", "gdpr", "hipaa", "sox", "pci-dss",
}


def _find_matches(text: str, word_set: set) -> list[str]:
    text_lower = text.lower()
    found = []
    for term in word_set:
        # Use word boundary for single words, substring match for phrases
        if " " in term:
            if term in text_lower:
                found.append(term)
        else:
            if re.search(rf"\b{re.escape(term)}\b", text_lower):
                found.append(term)
    return found


def extract_keywords(job_description: str) -> dict:
    """
    Returns a dict with keys: technical, soft, industry — each a list of strings.
    Pure local processing, no API call.
    """
    technical = _find_matches(job_description, _TECHNICAL)[:15]
    soft = _find_matches(job_description, _SOFT)[:8]
    industry = _find_matches(job_description, _INDUSTRY)[:8]

    return {"technical": technical, "soft": soft, "industry": industry}
