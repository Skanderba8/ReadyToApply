import os
import json
from groq import Groq
from services.validator import validate_cv
from services.utils import load_prompt
from models.schema import CVProfile

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

def generate_cv(profile: CVProfile, target_lang: str = "en", max_retries: int = 3) -> CVProfile:
    """
    Takes a CVProfile, rewrites it to be strong and clean.
    target_lang: "en" or "fr" — controls output language.
    Returns a validated CVProfile.
    """
    prompt = load_prompt("generate.txt")
    profile_json = json.dumps(profile.model_dump(), indent=2)

    lang_instruction = ""
    if target_lang == "fr":
        lang_instruction = "\n\nIMPORTANT: Write ALL content in French — summary, experience bullets, skill names, everything. Do not use English."

    user_message = f"{prompt}{lang_instruction}\n\nHere is the profile JSON to rewrite:\n\n{profile_json}"

    for attempt in range(max_retries):
        response = client.chat.completions.create(
            model="meta-llama/llama-4-scout-17b-16e-instruct",
            messages=[{"role": "user", "content": user_message}],
            temperature=0.3,
        )

        ai_output = response.choices[0].message.content

        try:
            improved_profile = validate_cv(ai_output)
            return improved_profile
        except ValueError as e:
            if attempt == max_retries - 1:
                raise ValueError(f"Generation failed after {max_retries} attempts: {e}")
            continue