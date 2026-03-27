import os
import json
from groq import Groq
from services.validator import validate_cv
from services.utils import load_prompt
from models.schema import CVProfile

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

def tailor_cv(profile: CVProfile, job_description: str, keywords: dict = None) -> CVProfile:
    """
    Takes a CVProfile, job description, and optional extracted keywords dict.
    Returns a tailored CVProfile with keywords woven throughout.
    """
    prompt = load_prompt("tailor.txt")
    profile_json = json.dumps(profile.model_dump(), indent=2)

    keywords_section = ""
    if keywords:
        keywords_section = f"\n\nExtracted keywords to weave into the CV:\n{json.dumps(keywords, indent=2)}"

    user_message = (
        f"{prompt}\n\n"
        f"Here is the CV JSON:\n\n{profile_json}\n\n"
        f"Here is the job description:\n\n{job_description}"
        f"{keywords_section}"
    )

    response = client.chat.completions.create(
        model="meta-llama/llama-4-scout-17b-16e-instruct",
        messages=[{"role": "user", "content": user_message}],
        temperature=0.3,
    )

    ai_output = response.choices[0].message.content
    return validate_cv(ai_output)
