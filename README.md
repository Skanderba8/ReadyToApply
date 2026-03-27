# ReadyToApply

> Upload your LinkedIn profile, paste a job description — get a tailored, ATS-clean CV in seconds.

**Live at:** [readytoapply.skander.cc](https://readytoapply.skander.cc)  
**Made by:** [Skander Ben Abdallah](https://github.com/Skanderba8)  
**License:** MIT

No accounts. No subscriptions. No stored data.

---

## What it does

ReadyToApply is a full-stack AI-powered CV tailoring tool. You upload your LinkedIn PDF (or paste your CV text), paste a job description, pick a template, and download a `.docx` CV that is rewritten to match the role — keywords woven in, bullets strengthened, summary tailored, section headings translated if the job is in French.

The entire pipeline runs in ~15 seconds and produces a clean Word document you can open, edit, and submit.

---

## Table of Contents

1. [Feature Overview](#feature-overview)
2. [Tech Stack](#tech-stack)
3. [Architecture](#architecture)
4. [Project Structure](#project-structure)
5. [AI Pipeline](#ai-pipeline)
6. [CV Templates](#cv-templates)
7. [Internationalisation (EN/FR)](#internationalisation-enfr)
8. [Security & Rate Limiting](#security--rate-limiting)
9. [CI/CD Pipeline](#cicd-pipeline)
10. [Running Locally](#running-locally)
11. [Deployment](#deployment)
12. [Environment Variables](#environment-variables)
13. [Tests](#tests)
14. [Design System](#design-system)
15. [Roadmap](#roadmap)

---

## Feature Overview

### Core flow
- **5-step wizard:** Profile upload → Job description → Review & edit → Template → Generate
- **PDF upload or paste** — accepts LinkedIn PDF exports or raw pasted text
- **AI extraction** — parses the uploaded CV into a structured JSON profile
- **AI generation** — rewrites bullets with action verbs and metrics, strengthens the summary
- **AI tailoring** — rewrites the entire CV to match the job description, weaving in extracted keywords
- **Drag-and-drop section reordering** — users can reorder CV sections before generating
- **Inline editing** — every field is editable in the review step before generation

### CV content
- **Keyword extraction** — technical, soft, and industry keywords pulled from the job description and injected throughout
- **Role matching** — the CV title is set to the exact job title from the posting
- **Dynamic page fitting** — content is scaled to fill exactly 1 page or 1.5–2 pages, never overflowing
- **Skills always even** — skills section always renders in clean 2-column pairs (8, 10, or 12 items)
- **Hyperlinked LinkedIn & GitHub** — contact line shows "LinkedIn" and "GitHub" as clickable words
- **Location normalisation** — city/region details stripped to country-level only (e.g. "Tunis, Gouvernorat de Tunis" → "Tunisia")

### Optional sections
- **Languages** — dropdown selector for language name + proficiency level, renders in 2-column table
- **Projects** — name, description, URL, year
- Both sections are toggled on/off with a switch and auto-enabled if data is found in the source PDF

### Internationalisation
- **Full EN/FR support** — every UI string is translated
- **Auto-detection** — when a French job description is typed, the entire app switches to French
- **Manual toggle** — EN/FR button in the top nav bar on every page
- **CV content translation** — the generated CV is written in the language of the job description (French job → French CV, including section headings like "Expérience", "Compétences", etc.)

### Templates
Three `.docx` templates, all ATS-safe:
- **Classic** — Calibri, centered header, black rules
- **Modern** — navy name, blue accent rules, left-aligned
- **Compact** — tight spacing, title + contact on one line

### UX details
- **Edit CV** button after generation — goes back to step 3 with all data cached, no re-extraction
- **Start over** button — resets everything and returns to step 1
- **Auto-generate on step 5** — no extra "Generate" click needed after choosing a template
- **Anonymous review widget** — stars + optional comment after download, stored in `backend/reviews.json`
- **GitHub badge** — persistent top-right button linking to this repo, always visible
- **"Made by Skander Ben Abdallah"** in the footer

---

## Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Frontend | Next.js 16 + Tailwind CSS 4 | App Router, TypeScript |
| Backend | Python 3.11 + FastAPI | Async, Pydantic v2 |
| AI | Groq API — `meta-llama/llama-4-scout-17b-16e-instruct` | 500K tokens/day free tier |
| Document generation | python-docx | Outputs `.docx`, borderless tables for skills |
| PDF parsing | pdfplumber | Extracts text from LinkedIn PDF exports |
| Drag and drop | @dnd-kit/core + @dnd-kit/sortable | Section reordering in review step |
| Rate limiting | slowapi | Per-IP limits on expensive endpoints |
| Frontend hosting | Vercel | Auto-deploys via CLI or git |
| Backend hosting | Render (Docker container) | Dockerfile in `backend/` |
| Domain | Cloudflare (skander.cc) | `readytoapply.skander.cc` → Vercel |
| Fonts | Syne (display) + DM Sans (body) | Loaded via `next/font/google` |
| CI/CD | GitHub Actions | Tests + deploy on push to `main` |

### Why these choices

- **Groq over OpenAI** — faster inference, generous free tier, `llama-4-scout` gives 500K tokens/day vs 100K for the 70b model
- **Render (Docker) over Render (Python)** — container gives full control over the environment, consistent with production
- **Vercel over Amplify** — native Next.js support, zero-config, free tier
- **python-docx over LaTeX/HTML-to-PDF** — produces clean, editable `.docx` files that ATS systems handle reliably
- **No database** — stateless by design; no user data is stored at any point

---

## Architecture

```
User browser
    │
    ├── readytoapply.skander.cc  (Cloudflare DNS → Vercel)
    │       └── Next.js 16 frontend
    │               └── NEXT_PUBLIC_API_URL ──────────────────┐
    │                                                          ▼
    └────────────────────────────────────────── Render (Docker container)
                                                    └── FastAPI backend
                                                            ├── /extract   (3 LLM calls)
                                                            ├── /generate  (1 LLM call)
                                                            ├── /review    (file write)
                                                            └── /health
                                                                    │
                                                                    └── Groq API
                                                                        (llama-4-scout)
```

---

## Project Structure

```
ReadyToApply/
├── .github/
│   ├── workflows/
│   │   └── ci.yml              # CI/CD — test + deploy on push to main
│   └── SECRETS.md              # How to configure GitHub secrets for deployment
│
├── frontend/
│   ├── app/
│   │   ├── globals.css         # Design tokens, keyframes, base reset
│   │   ├── layout.tsx          # Root layout — LangProvider, NavBar, fonts, metadata
│   │   ├── page.tsx            # Landing page (fully i18n)
│   │   └── build/
│   │       └── page.tsx        # 5-step flow controller — state management
│   ├── components/
│   │   ├── NavBar.tsx          # Fixed top bar — logo, EN/FR toggle, GitHub button
│   │   ├── StepIndicator.tsx   # Progress bar + step labels (i18n)
│   │   ├── StepProfile.tsx     # Step 1 — PDF upload or paste
│   │   ├── StepJob.tsx         # Step 2 — Job description (auto-detects language)
│   │   ├── StepReview.tsx      # Step 3 — Full CV editor with drag-and-drop sections
│   │   ├── StepTemplate.tsx    # Step 4 — Template picker (button says "Generate CV")
│   │   └── StepDownload.tsx    # Step 5 — Auto-generates, download + review widget
│   ├── lib/
│   │   ├── api.ts              # All fetch calls to backend (extractCV, generateCV)
│   │   └── i18n.tsx            # Language context, all UI strings, detectJobLang()
│   ├── tests/
│   │   ├── setup.ts            # Vitest setup
│   │   ├── i18n.test.ts        # Translation + language detection tests
│   │   └── api.test.ts         # API error handling + downloadBlob tests
│   ├── vitest.config.ts        # Vitest config (jsdom, path aliases)
│   ├── next.config.js
│   ├── package.json
│   └── .env.local              # NEXT_PUBLIC_API_URL (not committed)
│
├── backend/
│   ├── main.py                 # FastAPI app — routes, rate limiting, bot guard, CORS
│   ├── models/
│   │   └── schema.py           # Pydantic CV schema — enforced on every AI response
│   ├── services/
│   │   ├── parser.py           # PDF → raw text (pdfplumber)
│   │   ├── extractor.py        # LLM call 1 — raw text → structured profile JSON
│   │   ├── generator.py        # LLM call 2 — profile → clean CV (language-aware)
│   │   ├── keywords.py         # LLM call — job description → keyword categories
│   │   ├── tailor.py           # LLM call 3 — CV + job + keywords → tailored CV
│   │   ├── validator.py        # Schema enforcement, truncation, retry logic
│   │   └── renderer.py         # CVProfile → .docx bytes (3 templates, hyperlinks)
│   ├── templates/
│   │   ├── config.py           # Font, size, color config per template
│   │   └── base.py             # Shared docx helpers (set_font, add_section_heading)
│   ├── prompts/
│   │   ├── extract.txt         # v2 — extracts languages + projects
│   │   ├── generate.txt        # v3 — language-aware rewrite
│   │   └── tailor.txt          # v5 — language detection, location normalisation, keywords
│   ├── tests/
│   │   ├── test_schema.py      # Schema validation rules
│   │   ├── test_validator.py   # AI response parser
│   │   ├── test_api.py         # FastAPI endpoint integration tests
│   │   └── test_renderer.py    # Docx output validity tests
│   ├── reviews.json            # Anonymous user reviews (auto-created, gitignored)
│   ├── requirements.txt        # Production dependencies
│   ├── requirements-dev.txt    # Dev + test dependencies
│   ├── pytest.ini              # Pytest config
│   ├── Dockerfile              # Container definition for Render
│   ├── runtime.txt             # Python 3.11.0
│   └── .env                    # GROQ_API_KEY (not committed)
│
├── docs/
│   └── schema.json             # Canonical CV JSON schema reference
│
├── .env.example
├── .gitignore
└── README.md
```

---

## AI Pipeline

Every `/extract` request runs 3 sequential LLM calls, then `/generate` runs 1 more:

```
POST /extract
    ├── parser.py        PDF bytes → raw text (pdfplumber)
    ├── extractor.py     LLM 1: raw text → structured CVProfile JSON
    │                    (extract.txt prompt, temp=0.1)
    ├── generator.py     LLM 2: CVProfile → rewritten CVProfile
    │                    (generate.txt prompt, temp=0.3, language-aware)
    ├── keywords.py      LLM: job description → {technical, soft, industry} keywords
    │                    (inline prompt, temp=0.1)
    └── returns: { cv: CVProfile, keywords: Keywords }

POST /generate
    ├── tailor.py        LLM 3: CVProfile + job description + keywords → tailored CVProfile
    │                    (tailor.txt prompt, temp=0.3)
    │                    — detects language, translates content, normalises location
    │                    — weaves keywords into summary, bullets, skills
    │                    — sets title to exact job title
    │                    — enforces even skill count (8/10/12)
    ├── renderer.py      CVProfile → .docx bytes
    │                    — detects language from content for section headings
    │                    — scales font/spacing to fit 1 or 1.5–2 pages
    │                    — borderless 2-column table for skills + languages
    │                    — hyperlinked LinkedIn + GitHub in contact line
    └── returns: .docx file download
```

### Schema enforcement

Every LLM response is validated against `models/schema.py` (Pydantic v2). The validator:
- Strips markdown fences from the response
- Truncates summary to 800 chars
- Truncates skills to 12, then rounds down to nearest even number
- Truncates bullets to 6 per role
- Defaults `languages` and `projects` to `[]` if missing
- Retries up to 3 times on validation failure before raising

### Model

All LLM calls use `meta-llama/llama-4-scout-17b-16e-instruct` via Groq:
- 500K tokens/day on the free tier (vs 100K for llama-3.3-70b)
- Strong instruction-following for structured JSON output
- Fast inference (~3–5s per call)

---

## CV Templates

All templates are ATS-safe (no images, no text boxes, no headers/footers with content).

| Template | Font | Style | Best for |
|----------|------|-------|----------|
| Classic | Calibri | Centered header, black underline rules | Traditional industries |
| Modern | Calibri | Left-aligned, navy name, blue accent rules | Tech, startups |
| Compact | Calibri | Tight spacing, title+contact on one line | Dense experience |

### Page fitting

The renderer estimates content height and scales accordingly:
- **≤42 lines** → expand spacing + font size to fill 1 page
- **≥80 lines** → compress spacing + font size to stay within 2 pages
- **In between** → default spacing (targets ~1.5 pages)

### Skills rendering

Skills are rendered in a borderless 2-column Word table. The count is always even (padded with an empty cell if odd) so the table never has a half-empty row.

---

## Internationalisation (EN/FR)

### How it works

A React context (`lib/i18n.tsx`) holds the current language (`"en" | "fr"`) and a `u(key)` translation function. Every component calls `useLang()` to get translated strings.

```tsx
const { lang, setLang, u } = useLang();
// u("continue") → "Continue" or "Continuer"
```

### Auto-detection

When the user types a job description in `StepJob`, the text is analysed after 80+ characters. If enough French function words are detected, `setLang("fr")` is called and the entire app switches to French instantly.

```ts
export function detectJobLang(text: string): Lang {
  const hits = FR_WORDS.filter(w => text.toLowerCase().includes(w)).length;
  return hits >= 4 ? "fr" : "en";
}
```

### CV content translation

The `generate_cv` call receives the detected language and instructs the LLM to write all content in that language. The `tailor_cv` call reinforces this — the entire output (summary, bullets, skills, project descriptions) is in the job description's language.

The renderer detects the language from the CV content itself and uses the correct section headings:

| English | French |
|---------|--------|
| Summary | Résumé |
| Experience | Expérience |
| Education | Formation |
| Skills | Compétences |
| Projects | Projets |
| Languages | Langues |
| Certifications | Certifications |

---

## Security & Rate Limiting

### Rate limits (per IP, via slowapi)

| Endpoint | Limit |
|----------|-------|
| `/extract` | 5/minute, 20/hour |
| `/generate` | 10/minute, 40/hour |
| All others | 60/minute |

### Bot guard

The request middleware blocks common bot/scraper user agents (`python-requests`, `curl/`, `wget/`, `go-http`, `java/`) on POST endpoints. `httpx` is explicitly allowed (used by the test client).

### CORS

Only the following origins are allowed:
- `https://readytoapply.skander.cc`
- `https://readytoapply-frontend.vercel.app`
- `http://localhost:3000` (local dev)

### Input validation

- PDF max 5MB
- Job description max 8,000 characters
- Raw extracted text capped at 15,000 characters before LLM processing
- Template name validated against an allowlist (`classic`, `modern`, `compact`)
- Review stars validated as integer 1–5

---

## CI/CD Pipeline

Defined in `.github/workflows/ci.yml`. Triggers on every push and pull request to `main`.

```
push to main
    │
    ├── backend job
    │   ├── Setup Python 3.11
    │   ├── pip install -r requirements-dev.txt
    │   └── pytest tests/ -v --tb=short
    │
    ├── frontend job (parallel)
    │   ├── Setup Node 20
    │   ├── npm ci
    │   ├── npm test (vitest --run)
    │   └── tsc --noEmit (type check)
    │
    └── (on push to main only, after both pass)
        ├── deploy-backend
        │   └── curl RENDER_DEPLOY_HOOK_URL  (triggers Render redeploy)
        └── deploy-frontend
            └── vercel --prod --token $VERCEL_TOKEN
```

### Required GitHub secrets

| Secret | Where to get it |
|--------|----------------|
| `VERCEL_TOKEN` | vercel.com → Account Settings → Tokens |
| `VERCEL_ORG_ID` | `frontend/.vercel/project.json` → `orgId` |
| `VERCEL_PROJECT_ID` | `frontend/.vercel/project.json` → `projectId` |
| `RENDER_DEPLOY_HOOK_URL` | Render dashboard → service → Settings → Deploy Hook |

See `.github/SECRETS.md` for step-by-step setup instructions.

---

## Running Locally

### Prerequisites

- Python 3.11
- Node.js 20+
- A Groq API key — free at [console.groq.com](https://console.groq.com)

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
# → http://127.0.0.1:8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# → http://localhost:3000
```

### Environment files

`backend/.env`
```
GROQ_API_KEY=your_key_here
```

`frontend/.env.local`
```
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

### Docker (local backend testing)

```bash
cd backend
docker build -t readytoapply-backend .
docker run -p 8000:8000 --env-file .env readytoapply-backend
# → http://localhost:8000/health
```

---

## Deployment

### Backend — Render (Docker)

1. Create a new **Web Service** on [render.com](https://render.com)
2. Connect your GitHub repo
3. Set root directory to `backend/`
4. Runtime: **Docker**
5. Set environment variable: `GROQ_API_KEY=your_key`
6. Copy the Deploy Hook URL → add as `RENDER_DEPLOY_HOOK_URL` in GitHub secrets

> The free tier spins down after 15 minutes of inactivity. First request after idle takes 30–60s. Upgrade to Starter ($7/mo) to eliminate cold starts.

### Frontend — Vercel

```bash
cd frontend
npx vercel link          # first time only — generates .vercel/project.json
npx vercel --prod        # deploy
```

Set environment variable in Vercel dashboard:
```
NEXT_PUBLIC_API_URL=https://your-render-service.onrender.com
```

### DNS (Cloudflare)

| Type | Name | Target | Proxy |
|------|------|--------|-------|
| CNAME | `readytoapply` | `cname.vercel-dns.com` | DNS only (grey) |

Keep proxy **off** (grey cloud) — Cloudflare proxy interferes with Vercel SSL.

---

## Environment Variables

### Backend

| Variable | Required | Description |
|----------|----------|-------------|
| `GROQ_API_KEY` | Yes | Groq API key for all LLM calls |

### Frontend

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | Backend base URL (no trailing slash) |

---

## Tests

### Backend (pytest)

```bash
cd backend
pip install -r requirements-dev.txt
pytest tests/ -v
```

| File | What it tests |
|------|--------------|
| `test_schema.py` | Pydantic validators — summary truncation, skills even cap, bullets cap, optional fields |
| `test_validator.py` | AI response parser — JSON stripping, field truncation, missing field defaults |
| `test_api.py` | FastAPI endpoints — `/health`, `/generate`, `/review` with mocked LLM |
| `test_renderer.py` | Docx output — all 3 templates produce valid PK bytes, odd skills don't crash |

### Frontend (vitest)

```bash
cd frontend
npm test
```

| File | What it tests |
|------|--------------|
| `tests/i18n.test.ts` | `u()` translation function, `detectJobLang()` |
| `tests/api.test.ts` | Network error handling, API error detail propagation, `downloadBlob()` |

---

## Design System

### Color palette

| Token | Hex | Usage |
|-------|-----|-------|
| Flame | `#FF4D00` | Primary CTA, accents, active states |
| Ember | `#FF8C42` | Hover states |
| Coal | `#111111` | Page background |
| Ash | `#1C1C1C` | Card/input surfaces |
| Smoke | `#2E2E2E` | Borders, dividers |
| Chalk | `#F5F0EB` | Primary text |
| Mist | `#9A9A9A` | Secondary text, labels |

### Typography

| Role | Font | Variable |
|------|------|----------|
| Headings / display | Syne | `--font-display` |
| Body / UI | DM Sans | `--font-body` |

### Principles

- Dark background with warm flame accents
- Sharp edges — no rounded corners on interactive elements
- Minimal animation — fade-up on mount, translate on arrow hover
- `gap-px bg-[#2E2E2E]` grid pattern for card separators

---

## Roadmap

### Immediate
- [ ] Keep-alive ping to prevent Render cold starts (cron-job.org, free)
- [ ] `og:image` meta tag for social link previews
- [ ] Mobile QA pass on real devices

### Near-term features
- [ ] Cover letter generation (4th LLM call, same flow)
- [ ] HTML preview before download
- [ ] Job description URL input (auto-scrape the posting)
- [ ] Keyword highlighting in the review step

### Infrastructure (when traffic grows)
- [ ] Upgrade Render to Starter ($7/mo) — eliminates cold starts
- [ ] Add Plausible analytics (privacy-friendly)
- [ ] Move to Render paid tier or Fly.io for better performance

---

## Contributing

```
main     — production branch, auto-deploys on push
dev      — development branch, merge to main for releases
```

Commit format: `feat:`, `fix:`, `chore:`, `docs:`

To sync main with dev:
```bash
git checkout main
git reset --hard dev
git push origin main --force
```
