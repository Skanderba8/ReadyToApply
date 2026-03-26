import os
import json
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from pathlib import Path
load_dotenv(dotenv_path=Path(__file__).parent / ".env")

#print("GROQ KEY LOADED:", bool(os.environ.get("GROQ_API_KEY")))

from services.parser import parse_pdf
from services.extractor import extract_profile
from services.generator import generate_cv
from services.tailor import tailor_cv

app = FastAPI(title="ReadyToApply API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten this before production
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/generate")
async def generate(
    file: UploadFile = File(...),
    job_description: str = Form(...)
):
    """
    Main endpoint. Takes a PDF + job description, returns tailored CV JSON.
    """
    try:
        # Step 1 — parse PDF
        file_bytes = await file.read()
        raw_text = parse_pdf(file_bytes)

        # Step 2 — extract structured profile from raw text
        profile = extract_profile(raw_text)

        # Step 3 — rewrite to be strong and clean
        generated = generate_cv(profile)

        # Step 4 — tailor to job description
        tailored = tailor_cv(generated, job_description)

        return tailored.model_dump()

    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {e}")