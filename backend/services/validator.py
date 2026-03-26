import json
from models.schema import CVProfile
from pydantic import BaseModel
from typing import Optional

def validate_cv(ai_response: str, strict: bool = True) -> CVProfile:
    """
    Takes raw AI response string, parses and validates against CVProfile schema.
    If strict=False, truncates bullets to 4 instead of rejecting.
    """
    cleaned = ai_response.strip()
    if cleaned.startswith("```"):
        lines = cleaned.split("\n")
        lines = [l for l in lines if not l.strip().startswith("```")]
        cleaned = "\n".join(lines).strip()

    try:
        data = json.loads(cleaned)
    except json.JSONDecodeError as e:
        raise ValueError(f"AI response was not valid JSON: {e}")

    # If not strict, truncate bullets to 4 before validating
    if not strict:
        for exp in data.get("experience", []):
            if len(exp.get("bullets", [])) > 4:
                exp["bullets"] = exp["bullets"][:4]
        if len(data.get("skills", [])) > 12:
            data["skills"] = data["skills"][:12]

    try:
        profile = CVProfile(**data)
    except Exception as e:
        raise ValueError(f"AI response did not match CV schema: {e}")

    return profile