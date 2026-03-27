import os
import json
import time
import logging
import tempfile
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(dotenv_path=Path(__file__).parent / ".env")

from services.parser import parse_pdf
from services.extractor import extract_profile
from services.generator import generate_cv
from services.tailor import tailor_cv
from services.keywords import extract_keywords
from models.schema import CVProfile

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)s  %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S",
)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
MAX_FILE_BYTES     = 5 * 1024 * 1024   # 5 MB
MAX_JOB_DESC_CHARS = 8_000
MAX_RAW_TEXT_CHARS = 15_000

ALLOWED_ORIGINS = [
    "https://readytoapply.skander.cc",
    "https://readytoapply-frontend.vercel.app",
    "http://localhost:3000",
]

# ---------------------------------------------------------------------------
# Rate limiter — per IP
# /extract is expensive (3 LLM calls), cap tightly
# /generate is 1 LLM call, slightly more lenient
# ---------------------------------------------------------------------------
limiter = Limiter(key_func=get_remote_address, default_limits=["60/minute"])

# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------
app = FastAPI(title="ReadyToApply API")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Middleware — request logging + basic abuse guard
# ---------------------------------------------------------------------------
@app.middleware("http")
async def log_and_guard(request: Request, call_next):
    # Block non-browser user agents that look like scrapers/bots hitting POST
    if request.method == "POST":
        ua = request.headers.get("user-agent", "").lower()
        suspicious = ["python-requests", "curl", "wget", "httpx", "go-http", "java/"]
        if any(s in ua for s in suspicious):
            return JSONResponse(status_code=403, content={"detail": "Forbidden"})

    start = time.time()
    response = await call_next(request)
    duration = round((time.time() - start) * 1000)
    logger.info("%s %s  status=%s  duration=%dms",
                request.method, request.url.path, response.status_code, duration)
    return response

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _validate_file(file: UploadFile, file_bytes: bytes):
    if len(file_bytes) > MAX_FILE_BYTES:
        raise HTTPException(status_code=413,
            detail="File too large. Maximum allowed size is 5 MB.")
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=415,
            detail="Only PDF files are accepted.")

def _validate_job_description(job_description: str):
    jd = job_description.strip()
    if not jd:
        raise HTTPException(status_code=422, detail="Job description cannot be empty.")
    if len(jd) > MAX_JOB_DESC_CHARS:
        raise HTTPException(status_code=422,
            detail=f"Job description is too long. Maximum is {MAX_JOB_DESC_CHARS:,} characters.")
    return jd

# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/extract")
@limiter.limit("5/minute;20/hour")
async def extract(
    request: Request,
    file: UploadFile = File(...),
    job_description: str = Form(...),
):
    file_bytes = await file.read()
    _validate_file(file, file_bytes)
    job_description = _validate_job_description(job_description)

    try:
        raw_text = parse_pdf(file_bytes)
        raw_text = raw_text[:MAX_RAW_TEXT_CHARS]

        profile = extract_profile(raw_text)
        generated = generate_cv(profile)
        keywords = extract_keywords(job_description)

        return {"cv": generated.model_dump(), "keywords": keywords}

    except ValueError as e:
        logger.warning("Extract failed (422): %s", e)
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        logger.error("Extract unexpected error: %s", e, exc_info=True)
        raise HTTPException(status_code=500,
            detail="Something went wrong while processing your CV. Please try again.")


@app.post("/generate")
@limiter.limit("10/minute;40/hour")
async def generate(
    request: Request,
    cv_data: str = Form(...),
    job_description: str = Form(...),
    template: str = Form(default="classic"),
    keywords: str = Form(default=""),
):
    job_description = _validate_job_description(job_description)

    try:
        raw = json.loads(cv_data)
        profile = CVProfile(**raw)
    except (json.JSONDecodeError, Exception) as e:
        raise HTTPException(status_code=422, detail=f"Invalid CV data: {e}")

    parsed_keywords = None
    if keywords:
        try:
            parsed_keywords = json.loads(keywords)
        except json.JSONDecodeError:
            pass

    VALID_TEMPLATES = {"classic", "modern", "compact"}
    if template not in VALID_TEMPLATES:
        template = "classic"

    try:
        tailored = tailor_cv(profile, job_description, keywords=parsed_keywords)

        from services.renderer import render_cv
        docx_bytes = render_cv(tailored, template_name=template)

        safe_name = tailored.name.replace(" ", "_").replace("/", "_")
        filename = f"CV_{safe_name}.docx"

        return Response(
            content=docx_bytes,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={"Content-Disposition": f"attachment; filename={filename}"},
        )

    except ValueError as e:
        logger.warning("Generate failed (422): %s", e)
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        logger.error("Generate unexpected error: %s", e, exc_info=True)
        raise HTTPException(status_code=500,
            detail="Something went wrong while generating your CV. Please try again.")
