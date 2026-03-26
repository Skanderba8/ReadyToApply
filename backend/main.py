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

from fastapi.responses import Response

@app.post("/generate")
async def generate(
    file: UploadFile = File(...),
    job_description: str = Form(...),
    template: str = Form(default="classic")
):
    try:
        file_bytes = await file.read()
        raw_text = parse_pdf(file_bytes)
        profile = extract_profile(raw_text)
        generated = generate_cv(profile)
        tailored = tailor_cv(generated, job_description)

        # Render to .docx
        from services.renderer import render_cv
        docx_bytes = render_cv(tailored, template_name=template)

        return Response(
            content=docx_bytes,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={"Content-Disposition": "attachment; filename=cv.docx"}
        )

    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {e}")