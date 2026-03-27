import os
import json
from groq import Groq

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

_PROMPT = """You are a technical recruiter. Extract the most important keywords from the job description below.

Return ONLY a valid JSON object with this exact structure — no explanation, no markdown:
{
  "technical": ["keyword1", "keyword2"],
  "soft": ["keyword1", "keyword2"],
  "industry": ["keyword1", "keyword2"]
}

Rules:
- "technical": tools, languages, frameworks, platforms, methodologies (max 15)
- "soft": interpersonal and behavioural skills (max 8)
- "industry": domain terms, certifications, standards (max 8)
- Use the exact wording from the job description where possible
- No duplicates across categories
"""

def extract_keywords(job_description: str, max_retries: int = 3) -> dict:
    """
    Takes a job description string.
    Returns a dict with keys: technical, soft, industry — each a list of strings.
    Falls back to empty lists if extraction fails (non-fatal).
    """
    user_message = f"{_PROMPT}\n\nJob description:\n\n{job_description}"

    for attempt in range(max_retries):
        try:
            response = client.chat.completions.create(
                model="meta-llama/llama-4-scout-17b-16e-instruct",
                messages=[{"role": "user", "content": user_message}],
                temperature=0.1,
            )
            raw = response.choices[0].message.content.strip()

            # Strip markdown fences if present
            if raw.startswith("```"):
                lines = raw.split("\n")
                lines = [l for l in lines if not l.strip().startswith("```")]
                raw = "\n".join(lines).strip()

            data = json.loads(raw)

            # Normalise — ensure all three keys exist and are lists of strings
            result = {
                "technical": [str(k) for k in data.get("technical", [])],
                "soft":      [str(k) for k in data.get("soft", [])],
                "industry":  [str(k) for k in data.get("industry", [])],
            }
            return result

        except Exception:
            if attempt == max_retries - 1:
                # Non-fatal: return empty rather than crashing the whole request
                return {"technical": [], "soft": [], "industry": []}
            continue