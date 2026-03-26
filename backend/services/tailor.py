import os
import json
from groq import Groq
from services.validator import validate_cv
from models.schema import CVProfile

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

def load_prompt(filename: str) -> str:
    prompt_path = os.path.join(os.path.dirname(__file__), "..", "prompts", filename)
    with open(prompt_path, "r", encoding="utf-8") as f:
        return f.read()

def tailor_cv(profile: CVProfile, job_description: str, max_retries: int = 3) -> CVProfile:
    """
    Takes a CVProfile and job description, returns a tailored CVProfile.
    """
    prompt = load_prompt("tailor.txt")
    profile_json = json.dumps(profile.model_dump(), indent=2)
    user_message = f"{prompt}\n\nHere is the CV JSON:\n\n{profile_json}\n\nHere is the job description:\n\n{job_description}"

    for attempt in range(max_retries):
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": user_message}],
            temperature=0.3,
        )

        ai_output = response.choices[0].message.content

        try:
            tailored_profile = validate_cv(ai_output)
            return tailored_profile
        except ValueError as e:
            if attempt == max_retries - 1:
                raise ValueError(f"Tailoring failed after {max_retries} attempts: {e}")
            continue