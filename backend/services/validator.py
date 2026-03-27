import json
from models.schema import CVProfile

def validate_cv(ai_response: str, strict: bool = True) -> CVProfile:
    cleaned = ai_response.strip()
    if cleaned.startswith("```"):
        lines = cleaned.split("\n")
        lines = [l for l in lines if not l.strip().startswith("```")]
        cleaned = "\n".join(lines).strip()

    try:
        data = json.loads(cleaned)
    except json.JSONDecodeError as e:
        raise ValueError(f"AI response was not valid JSON: {e}")

    # Always truncate to schema limits — never hard-fail on count overflows
    for exp in data.get("experience", []):
        if len(exp.get("bullets", [])) > 6:
            exp["bullets"] = exp["bullets"][:6]

    if len(data.get("skills", [])) > 12:
        data["skills"] = data["skills"][:12]

    summary = data.get("summary", "")
    if len(summary) > 800:
        truncated = summary[:800]
        last_stop = max(truncated.rfind(". "), truncated.rfind("! "), truncated.rfind("? "))
        data["summary"] = truncated[:last_stop + 1].strip() if last_stop != -1 else truncated.strip()

    # Ensure optional new fields default to empty lists if missing
    data.setdefault("languages", [])
    data.setdefault("projects", [])

    try:
        profile = CVProfile(**data)
    except Exception as e:
        raise ValueError(f"AI response did not match CV schema: {e}")

    return profile
