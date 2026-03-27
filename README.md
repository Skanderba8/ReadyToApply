# ReadyToApply

> Upload your LinkedIn profile, paste a job description, get a tailored ATS-clean CV in seconds.

**Core flow:** Profile in → Job description in → Template chosen → CV downloaded.
No accounts. No subscriptions. No stored data.

**Live at:** [readytoapply.skander.cc](https://readytoapply.skander.cc)

---

## Table of Contents

1. [Project Status](#project-status)
2. [Live URLs](#live-urls)
3. [Tech Stack](#tech-stack)
4. [Project Structure](#project-structure)
5. [Design System](#design-system)
6. [How the Backend Works](#how-the-backend-works)
7. [Running Locally](#running-locally)
8. [Deployment](#deployment)
9. [Updating the Live App](#updating-the-live-app)
10. [Domain & DNS](#domain--dns)
11. [Prompts](#prompts)
12. [Contributing](#contributing)
13. [Next Steps & Roadmap](#next-steps--roadmap)

---

## Project Status

| Part | What | Status |
|------|------|--------|
| 0 | Foundation — schema, prompts, Groq verified | ✅ Done |
| 1 | Backend — FastAPI, 3 AI calls, JSON output | ✅ Done |
| 2 | Renderer — python-docx, .docx output | ✅ Done |
| 3 | Frontend — Next.js, landing page, 4-step flow | ✅ Done |
| 4 | Frontend ↔ Backend connected locally | ✅ Done |
| 5 | Deployment — Render (backend) + Vercel (frontend) | ✅ Done |
| 6 | QA, polish, launch | ⬜ Next |

---

## Live URLs

| Service | URL |
|---------|-----|
| Frontend (production) | https://readytoapply.skander.cc |
| Frontend (Vercel alias) | https://readytoapply-frontend.vercel.app |
| Backend (Render) | https://readytoapply.onrender.com |
| Backend health check | https://readytoapply.onrender.com/health |

---

## Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Frontend | Next.js 16 + Tailwind CSS 4 | Deployed on Vercel |
| Backend | Python 3.11 + FastAPI | Deployed on Render (free tier) |
| AI | Groq API — llama-3.3-70b-versatile | 3 sequential LLM calls per request |
| Document generation | python-docx | Outputs .docx files |
| PDF parsing | pdfplumber | Extracts text from LinkedIn PDF exports |
| Frontend hosting | Vercel (free) | Auto-deploys via Vercel CLI |
| Backend hosting | Render (free tier) | Runs Python directly, no Docker on free tier |
| Domain | Cloudflare (skander.cc) | Subdomain: readytoapply.skander.cc |
| Container registry | AWS ECR (eu-west-3) | Image pushed but not actively used — kept for future scaling |
| Fonts | Syne (display) + DM Sans (body) | Loaded via next/font/google |

### Why these choices

- **Groq over OpenAI** — significantly faster inference, generous free tier, llama-3.3-70b gives strong CV quality
- **Render over AWS App Runner** — App Runner has no free tier; Render free tier is sufficient for an early-stage app
- **Vercel over Amplify/S3** — native Next.js support, zero-config deploys, free tier
- **python-docx over LaTeX/HTML-to-PDF** — produces clean, editable .docx files that ATS systems handle reliably
- **No database** — stateless by design; no user data is stored at any point

---

## Project Structure

```
ReadyToApply/
├── frontend/
│   ├── app/
│   │   ├── globals.css           # Design tokens, keyframes, base reset
│   │   ├── layout.tsx            # Root layout, Syne + DM Sans fonts, metadata
│   │   ├── page.tsx              # Landing page
│   │   └── build/
│   │       └── page.tsx          # 4-step flow controller
│   ├── components/
│   │   ├── StepIndicator.tsx     # Progress bar across steps
│   │   ├── StepProfile.tsx       # Step 1 — PDF upload or paste
│   │   ├── StepJob.tsx           # Step 2 — Job description input
│   │   ├── StepTemplate.tsx      # Step 3 — Template picker
│   │   └── StepDownload.tsx      # Step 4 — Generate + download
│   ├── lib/
│   │   └── api.ts                # All fetch calls to backend
│   ├── public/
│   │   └── logo.svg              # Brand logo (used in nav, footer, favicon)
│   ├── AGENTS.md                 # AI coding agent rules for this project
│   ├── CLAUDE.md                 # Claude-specific coding instructions
│   ├── .vercel/                  # Vercel project config (do not edit manually)
│   └── .env.local                # NEXT_PUBLIC_API_URL (not committed)
│
├── backend/
│   ├── main.py                   # FastAPI routes — /health, /generate
│   ├── models/
│   │   └── schema.py             # Pydantic CV schema — enforced on every AI response
│   ├── services/
│   │   ├── parser.py             # PDF → raw text (pdfplumber)
│   │   ├── extractor.py          # LLM call 1 — raw text → profile JSON
│   │   ├── generator.py          # LLM call 2 — profile JSON → clean CV
│   │   ├── tailor.py             # LLM call 3 — CV + job description → tailored CV
│   │   ├── validator.py          # Schema enforcement + re-prompt logic
│   │   └── renderer.py           # CVProfile → .docx bytes
│   ├── templates/
│   │   ├── config.py             # Template styling config (font, size, color)
│   │   └── base.py               # Shared docx rendering helpers
│   ├── prompts/
│   │   ├── extract.txt           # Prompt v1 — locked
│   │   ├── generate.txt          # Prompt v1 — locked
│   │   └── tailor.txt            # Prompt v1 — locked
│   ├── requirements.txt          # Python dependencies
│   ├── runtime.txt               # Python 3.11.0 — tells Render which version to use
│   ├── .python-version           # Python 3.11.0 — backup version pin
│   ├── .env                      # GROQ_API_KEY (not committed)
│   └── Dockerfile                # Built and pushed to AWS ECR — not used by Render
│
├── docs/
│   ├── schema.json               # Canonical CV JSON schema
│   ├── cv-rules.md               # Content rules injected into prompts
│   └── prompts-guide.md          # How to version prompts safely
│
├── .gitignore
├── .env.example
└── README.md
```

---

## Design System

Defined in `frontend/app/globals.css` and enforced in `frontend/AGENTS.md`.

### Color Palette

| Token | Value | Usage |
|-------|-------|-------|
| `--color-flame` | `#FF4D00` | Primary CTA, accents, icons |
| `--color-ember` | `#FF8C42` | Hover states |
| `--color-coal` | `#111111` | Page background |
| `--color-ash` | `#1C1C1C` | Card surfaces |
| `--color-smoke` | `#2E2E2E` | Borders, dividers |
| `--color-chalk` | `#F5F0EB` | Primary text |
| `--color-mist` | `#9A9A9A` | Secondary text, labels |

### Typography

| Role | Font | Weights | Variable |
|------|------|---------|----------|
| Display / Headings | Syne | 400–800 | `--font-display` |
| Body / UI | DM Sans | 300–600 | `--font-body` |

### Design Principles
- Dark background (`#111111`) with warm flame accents
- No rounded corners on buttons — sharp edges (`rounded-none`)
- Minimal animations — fade-up on hero, translate on arrow icons
- Decorative elements: dot grid (bottom left), concentric rings (top right), `#2E2E2E` dividers
- Grid layout for "How it works" section — `gap-px bg-[#2E2E2E]` creates thin separator lines between cards

### Logo
- File: `frontend/public/logo.svg`
- Used in: nav (24px), footer (18px), browser favicon
- Placed inline next to brand name using `flex items-center gap-2`

---

## How the Backend Works

Every `/generate` request runs 3 sequential AI calls:

```
POST /generate
    ├── parser.py       PDF upload → extract raw text (pdfplumber)
    ├── extractor.py    LLM call 1: raw text → structured JSON profile
    ├── generator.py    LLM call 2: rewrite bullets + summary to be strong
    ├── tailor.py       LLM call 3: tailor everything to the job description
    ├── validator.py    enforce Pydantic schema on every AI response
    │                   retry up to 3x on invalid responses before erroring
    └── renderer.py     CVProfile JSON → .docx bytes → file download response
```

### Schema Contract

`backend/models/schema.py` is the contract between the AI and the renderer. Every LLM response is validated against it before the next step runs. If validation fails, the call is re-prompted up to 3 times. If it still fails after 3 attempts, a 500 error is returned.

### Routes

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Returns `{"status":"ok"}` — used for uptime checks |
| `POST` | `/generate` | Main endpoint — accepts PDF + job description, returns .docx |

### CORS

The backend allows requests from the Vercel frontend domain. If you add a custom domain, update the CORS origins in `main.py`.

---

## Running Locally

### Prerequisites
- Python 3.11
- Node.js 18+
- A Groq API key (free at [console.groq.com](https://console.groq.com))

### Backend

```powershell
cd backend
python -m venv venv
venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload
# Runs on http://127.0.0.1:8000
```

### Frontend

```powershell
cd frontend
npm install
npm run dev
# Runs on http://localhost:3000
```

### Required env files

`backend/.env`
```
GROQ_API_KEY=your_key_here
```

`frontend/.env.local`
```
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

### Docker (local testing only)

The Dockerfile builds a production image of the backend. Use this to test the container locally before pushing to ECR.

```powershell
cd backend
docker build -t readytoapply-backend .
docker run -p 8000:8000 --env-file .env readytoapply-backend
# Test: http://localhost:8000/health
```

---

## Deployment

### Architecture

```
User
 │
 ├── readytoapply.skander.cc  (Cloudflare DNS → Vercel)
 │       └── Next.js frontend
 │               └── NEXT_PUBLIC_API_URL → Render backend
 │
 └── readytoapply.onrender.com
         └── FastAPI backend (Python 3.11, Render free tier)
                 └── GROQ_API_KEY (set in Render environment)
```

### Backend — Render

The backend runs as a Python web service on Render's free tier.

- **Platform:** Render
- **Runtime:** Python 3.11
- **Root directory:** `backend/`
- **Build command:** `pip install -r requirements.txt`
- **Start command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
- **Environment variables:** `GROQ_API_KEY` (set in Render dashboard)

> ⚠️ **Free tier spin-down:** Render's free tier spins down the service after 15 minutes of inactivity. The first request after idle will take 30–60 seconds to respond while the service wakes up. This is expected behaviour on the free tier.

#### Re-deploying the backend

Push to `main` — Render auto-deploys on commit if auto-deploy is enabled. Or trigger manually from the Render dashboard.

### Frontend — Vercel

The frontend is a Next.js app deployed via Vercel CLI.

- **Platform:** Vercel
- **Framework:** Next.js 16
- **Root directory:** `frontend/`
- **Environment variables:** `NEXT_PUBLIC_API_URL=https://readytoapply.onrender.com`

#### Re-deploying the frontend

```powershell
cd frontend
npx vercel --prod
```

### AWS ECR (kept for future use)

A Docker image of the backend was built and pushed to AWS ECR during initial deployment exploration. It is not currently serving traffic but is available if you want to migrate to a container-based hosting solution (e.g. AWS App Runner, ECS, Fly.io).

- **Registry:** `166799230506.dkr.ecr.eu-west-3.amazonaws.com/readytoapply-backend`
- **Region:** `eu-west-3` (Paris)
- **Tag:** `latest`

To push a new image:
```powershell
$token = aws ecr get-login-password --region eu-west-3
docker login --username AWS --password $token 166799230506.dkr.ecr.eu-west-3.amazonaws.com
docker build -t readytoapply-backend ./backend
docker tag readytoapply-backend:latest 166799230506.dkr.ecr.eu-west-3.amazonaws.com/readytoapply-backend:latest
docker push 166799230506.dkr.ecr.eu-west-3.amazonaws.com/readytoapply-backend:latest
```

---

## Updating the Live App

### Frontend change (UI, copy, styles)

```powershell
# Make your changes in frontend/
cd frontend
npx vercel --prod
```

### Backend change (API, AI logic, prompts)

```powershell
# Make your changes in backend/
git add .
git commit -m "feat: your change description"
git push origin main
# Render auto-deploys on push to main
```

### Both at once

```powershell
git add .
git commit -m "feat: your change description"
git push origin main
cd frontend
npx vercel --prod
```

---

## Domain & DNS

- **Registrar:** Cloudflare (skander.cc)
- **Subdomain:** `readytoapply.skander.cc` → points to Vercel

### DNS record in Cloudflare

| Type | Name | Target | Proxy |
|------|------|--------|-------|
| CNAME | `readytoapply` | `cname.vercel-dns.com` | DNS only (grey) |

> Keep proxy status as **DNS only** (grey cloud). Enabling Cloudflare proxy (orange) can interfere with Vercel's SSL certificate provisioning.

### Adding a custom domain to the backend (optional)

If you want a clean URL for the API (e.g. `api.readytoapply.skander.cc`):
1. Add a CNAME in Cloudflare pointing to your Render service URL
2. Add the custom domain in Render dashboard → Settings → Custom Domains
3. Update `NEXT_PUBLIC_API_URL` in Vercel to the new API domain
4. Redeploy frontend: `npx vercel --prod`

---

## Prompts

Prompts are locked. Never edit prompt files in place.

### To change a prompt

1. Create a new versioned file e.g. `extract_v2.txt`
2. Update the reference in the corresponding service file (`extractor.py`, `generator.py`, or `tailor.py`)
3. Document why in `docs/prompts-guide.md`
4. Test locally before pushing

### Current prompt versions

| Prompt | File | Version | Status |
|--------|------|---------|--------|
| Extract | `prompts/extract.txt` | v1 | Locked |
| Generate | `prompts/generate.txt` | v1 | Locked |
| Tailor | `prompts/tailor.txt` | v1 | Locked |

---

## Contributing

1. All work happens on `dev` branch
2. Merge to `main` only for releases
3. Commit format: `feat:`, `fix:`, `chore:`
4. To force-sync `main` with `dev`:

```powershell
git checkout main
git reset --hard dev
git push origin main --force
```

---

## Next Steps & Roadmap

### Part 6 — QA & Polish (immediate)

These are the things to fix/improve before calling the app launch-ready.

#### Backend
- [ ] **CORS hardening** — lock CORS origins to `readytoapply.skander.cc` only, remove wildcard if present
- [ ] **Error messages** — return user-friendly error messages from `/generate` instead of raw 500s
- [ ] **Request validation** — add file size limit on PDF upload (max 5MB)
- [ ] **Timeout handling** — add a clear timeout error if Groq takes too long (currently silent)
- [ ] **Logging** — add basic request logging (timestamp, endpoint, status, duration)

#### Frontend
- [ ] **Loading state** — show a proper loading animation during the generate step (currently basic)
- [ ] **Error handling** — show a clear error message if the backend fails or times out
- [ ] **Mobile testing** — test the full flow on a real mobile device
- [ ] **Render cold start UX** — add a "warming up..." message if the backend takes >5s to respond
- [ ] **Meta tags** — add `og:image` for link previews when sharing on social

#### QA checklist
- [ ] Upload a real LinkedIn PDF export end to end
- [ ] Test with a long job description (3000+ words)
- [ ] Test with a short job description (<100 words)
- [ ] Test on Safari (iOS)
- [ ] Test from a different network (not your home WiFi)
- [ ] Verify downloaded .docx opens correctly in Word and Google Docs

---

### Scaling — When You Start Getting Traffic

#### Fix the Render cold start problem
The free tier spins down after 15 minutes of inactivity. Two options:
- **Upgrade to Render Starter ($7/month)** — always-on, no spin-down
- **Add a keep-alive ping** — set up a cron job (e.g. via cron-job.org, free) that hits `/health` every 10 minutes to keep the service warm

#### Move backend to a paid tier when needed
Current free tier limits: 512MB RAM, 0.1 CPU. If you start seeing slow responses or OOM errors under load, upgrade to Render Starter ($7/month) which gives 512MB RAM and 0.5 CPU with zero downtime deploys.

#### Add a CDN for the backend (optional)
If you want the API URL to look clean, add `api.readytoapply.skander.cc` as described in the Domain section above.

---

### Feature Roadmap

#### High priority
- [ ] **Multiple CV templates** — add 2-3 more visual styles in `backend/templates/` and surface them in `StepTemplate.tsx`
- [ ] **Cover letter generation** — add a 4th LLM call that generates a tailored cover letter alongside the CV
- [ ] **LinkedIn URL input** — instead of PDF upload, accept a LinkedIn profile URL and scrape it (requires a scraping solution)
- [ ] **Plain text input** — let users paste raw CV text instead of uploading a PDF (already partially supported — polish the UX)

#### Medium priority
- [ ] **Preview before download** — show a rendered HTML preview of the CV before the user downloads the .docx
- [ ] **Multiple download formats** — offer both .docx and .pdf output
- [ ] **Job description URL** — accept a job posting URL and scrape the description automatically
- [ ] **Keyword highlighting** — show which keywords from the job description were injected into the CV

#### Lower priority / future
- [ ] **Analytics** — add Plausible or Fathom (privacy-friendly) to track page views and conversion
- [ ] **Feedback loop** — add a simple thumbs up/down on the download step to collect quality signal
- [ ] **API rate limiting** — add rate limiting on `/generate` to prevent abuse (e.g. slowapi)
- [ ] **Waitlist / email capture** — add an email input before the flow for users who want to be notified of new features
- [ ] **Accounts (optional)** — if you ever want saved CVs, add auth via Clerk or Supabase Auth — but keep the no-account flow as the default

---

### Infrastructure Roadmap (when ready to scale beyond free tier)

| When | What | Why |
|------|------|-----|
| >100 req/day | Upgrade Render to Starter ($7/mo) | Eliminate cold starts |
| >1000 req/day | Move backend to AWS ECS + ECR | Better scaling, use the Docker image already in ECR |
| Custom domain for API | Add `api.readytoapply.skander.cc` | Cleaner URLs, easier to swap backends |
| Need SSL on API | AWS Certificate Manager (us-east-1) | Free SSL, attach to CloudFront or ALB |
| Need CI/CD pipeline | GitHub Actions | Auto-test on PR, auto-deploy on merge to main |

#### GitHub Actions CI/CD (when ready)

A simple pipeline for the backend would:
1. On PR to `main` — run `pytest` on the backend
2. On merge to `main` — build Docker image, push to ECR, trigger Render redeploy

A simple pipeline for the frontend would:
1. On merge to `main` — run `next build` to verify it compiles
2. Vercel handles the actual deploy automatically via git integration (once you switch from CLI to git-based deploys)

---

## Environment Variables Reference

### Backend (set in Render dashboard)

| Variable | Description | Where to get it |
|----------|-------------|-----------------|
| `GROQ_API_KEY` | Groq API key for LLM calls | console.groq.com |

### Frontend (set via `npx vercel env add`)

| Variable | Description | Value |
|----------|-------------|-------|
| `NEXT_PUBLIC_API_URL` | Backend base URL | `https://readytoapply.onrender.com` |

---

## License

MIT