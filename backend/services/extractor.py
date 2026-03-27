import os
from groq import Groq
from services.validator import validate_cv
from services.utils import load_prompt
from models.schema import CVProfile

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

def extract_profile(raw_text: str, max_retries: int = 3) -> CVProfile:
    """
    Takes raw CV text, returns a validated CVProfile object.
    Retries up to max_retries times if validation fails.
    """
    prompt = load_prompt("extract.txt")
    user_message = f"{prompt}\n\nHere is the CV text to extract:\n\n{raw_text}"

    for attempt in range(max_retries):
        response = client.chat.completions.create(
            model="meta-llama/llama-4-scout-17b-16e-instruct",
            messages=[{"role": "user", "content": user_message}],
            temperature=0.1,
        )

        ai_output = response.choices[0].message.content

        try:
            profile = validate_cv(ai_output, strict=False)
            return profile
        except ValueError as e:
            if attempt == max_retries - 1:
                raise ValueError(f"Extraction failed after {max_retries} attempts: {e}")
            continue