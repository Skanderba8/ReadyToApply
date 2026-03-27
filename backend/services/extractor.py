import os
from groq import Groq
from services.validator import validate_cv
from services.utils import load_prompt
from models.schema import CVProfile

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

def extract_profile(raw_text: str) -> CVProfile:
    """
    Takes raw CV text, extracts and rewrites it in a single LLM call.
    Returns a validated CVProfile object.
    """
    prompt = load_prompt("extract_and_generate.txt")
    user_message = f"{prompt}\n\nHere is the CV text:\n\n{raw_text}"

    response = client.chat.completions.create(
        model="meta-llama/llama-4-scout-17b-16e-instruct",
        messages=[{"role": "user", "content": user_message}],
        temperature=0.2,
    )

    ai_output = response.choices[0].message.content
    return validate_cv(ai_output, strict=False)
