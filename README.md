# ReadyToApply

> Upload your LinkedIn profile, paste a job description, get a tailored ATS-clean CV in seconds — every time you apply.

---

## What it does

ReadyToApply takes your profile (LinkedIn PDF export or manual entry), a job description you paste, and a template you choose — and generates a properly formatted, ATS-friendly CV as a `.docx` file in under 30 seconds. No accounts. No subscriptions. No stored data.

**Core flow:** Profile in → Job description in → Template chosen → CV downloaded.

---

## Tech stack

| Layer | Technology | Why |
|---|---|---|
| Frontend | Next.js 14 + Tailwind CSS | Static export, deploys to S3/CloudFront trivially |
| Backend | Python FastAPI | Best ecosystem for PDF parsing and docx generation |
| AI | Groq API — Llama 3.3 70B | Free tier, fast, sufficient for structured generation tasks |
| Document generation | `python-docx` | Full programmatic control over every formatting detail |
| PDF parsing | `pdfplumber` | Best accuracy on LinkedIn's export format |
| Infrastructure | AWS Lambda + API Gateway + S3 + CloudFront | Scales to zero cost at MVP traffic |
| IaC | SST v3 | Single config file provisions the entire AWS stack |

---

## Repo structure

```
readytoapply/
├── frontend/                     # Next.js app
│   ├── app/
│   │   ├── page.tsx              # Landing page
│   │   └── build/
│   │       └── page.tsx          # 4-step generation flow
│   ├── components/
│   │   ├── StepProfile.tsx       # Step 1: LinkedIn upload or manual form
│   │   ├── StepJob.tsx           # Step 2: Job description input
│   │   ├── StepTemplate.tsx      # Step 3: Template picker
│   │   └── StepDownload.tsx      # Step 4: Generate + download
│   ├── lib/
│   │   └── api.ts                # Backend API call wrappers
│   ├── public/
│   │   └── previews/             # Template thumbnail images (5x)
│   ├── styles/
│   │   └── globals.css           # CSS variables — single source of truth
│   └── next.config.js
│
├── backend/                      # FastAPI app
│   ├── main.py                   # Routes and app entry point
│   ├── models/
│   │   └── schema.py             # Pydantic models — the fixed JSON contract
│   ├── services/
│   │   ├── parser.py             # PDF text extraction (pdfplumber)
│   │   ├── extractor.py          # LLM call 1 — raw text → profile JSON
│   │   ├── generator.py          # LLM call 2 — profile JSON → base CV
│   │   ├── tailor.py             # LLM call 3 — CV + job description → tailored CV
│   │   ├── validator.py          # JSON schema enforcement + re-prompt logic
│   │   └── renderer.py           # python-docx template engine
│   ├── templates/
│   │   ├── config.py             # 5 template configs (font, spacing, colors)
│   │   └── base.py               # Shared rendering functions all templates use
│   ├── prompts/
│   │   ├── extract.txt           # Prompt 1 — locked, do not edit without versioning
│   │   ├── generate.txt          # Prompt 2 — locked
│   │   └── tailor.txt            # Prompt 3 — locked
│   ├── requirements.txt
│   └── Dockerfile
│
├── docs/
│   ├── schema.json               # The canonical profile JSON schema
│   ├── cv-rules.md               # CV content rules (bullets, chars, sections)
│   ├── ats-rules.md              # ATS formatting constraints per template
│   └── prompts-guide.md          # How to edit prompts safely
│
├── sst.config.ts                 # Full AWS infrastructure definition
├── .env.example                  # All required env vars, no values
├── .gitignore
└── README.md
```

---

## Environment variables

Never commit real values. Copy `.env.example` to `.env` and fill locally. In production, set via SST secrets.

```env
# AI
GROQ_API_KEY=

# AWS (set via SST secrets in production)
AWS_REGION=eu-west-1
S3_OUTPUT_BUCKET=

# Backend
MAX_REQUESTS_PER_HOUR=20
LAMBDA_TIMEOUT_SECONDS=60
LAMBDA_MEMORY_MB=1024

# Frontend
NEXT_PUBLIC_API_URL=
```

---

## Build plan

The app is built across 7 sequential parts. Do not move to the next part until the exit condition of the current one is met. Each part produces something real and testable — not just code.

---

### Part 0 — Foundation & blueprint

**Goal:** Lock every contract the rest of the app depends on before writing any application code. The JSON schema, prompt rules, and content constraints must be fixed first — changing them later breaks backend and prompts simultaneously.

#### 0.1 — Repo setup

- [ ] Create GitHub repo named `readytoapply`, visibility: **public**
- [ ] Set repo description: `AI-powered CV tailoring tool. Upload your LinkedIn profile, paste a job description, get a clean ATS-ready CV in seconds.`
- [ ] Initialize with README (replace with this file)
- [ ] Add `.gitignore` — must cover: `*.env`, `__pycache__`, `.next`, `node_modules`, `*.pyc`, `.DS_Store`
- [ ] Set license: MIT
- [ ] Create two branches: `main` (production) and `dev` (all work happens here, merge to main only for releases)
- [ ] Set branch protection on `main`: require PR to merge, no direct pushes
- [ ] Create the full folder structure from the repo structure section above (empty files are fine)
- [ ] Push the scaffolded structure as the first commit on `dev`


#### 0.3 — Define the JSON schema

Create `docs/schema.json`. This is the exact shape every AI call must return. Every field is required. No extras allowed.

```json
{
  "name": "string",
  "title": "string — current or target job title",
  "contact": {
    "email": "string",
    "phone": "string",
    "location": "string — City, Country",
    "linkedin": "string — optional, linkedin.com/in/handle"
  },
  "summary": "string — max 400 characters, max 3 sentences",
  "experience": [
    {
      "company": "string",
      "title": "string",
      "location": "string",
      "start": "string — Mon YYYY format e.g. Jan 2021",
      "end": "string — Mon YYYY or Present",
      "bullets": ["string — max 120 chars each, max 4 bullets per role"]
    }
  ],
  "education": [
    {
      "institution": "string",
      "degree": "string",
      "field": "string",
      "year": "string — YYYY"
    }
  ],
  "skills": ["string — max 12 items total"],
  "certifications": [
    {
      "name": "string",
      "issuer": "string",
      "year": "string"
    }
  ]
}
```

- [ ] Create `docs/schema.json` with the above
- [ ] Write the Pydantic model in `backend/models/schema.py` that enforces this schema in Python
- [ ] Any AI output that does not match this schema must be rejected and re-prompted — never passed to the renderer

#### 0.4 — CV content rules

Create `docs/cv-rules.md` with these rules. The AI prompts and the validator both enforce them.

```
CONTENT RULES — enforced by validator.py before any render call

Summary
- Maximum 400 characters
- Maximum 3 sentences
- No first-person pronouns (I, me, my)
- No "Passionate about" or "Results-driven" openers

Experience bullets
- Maximum 4 bullets per role
- Maximum 120 characters per bullet
- Must start with a past-tense action verb (Led, Built, Reduced, Managed...)
- Must contain at least one number or metric where possible
- No bullet may start with "Responsible for"
- No bullet may start with "Worked on"

Skills
- Maximum 12 items
- Single words or short phrases only (no sentences)
- No soft skills (no "Team player", "Good communicator")

Forbidden phrases — anywhere in document
- "Passionate about"
- "Results-driven"
- "Dynamic"
- "Synergy" / "Synergize"
- "Leverage" (as a verb)
- "Spearhead"
- "Go-getter"
- "Think outside the box"
```

- [ ] Create `docs/cv-rules.md` with the above
- [ ] These rules are injected verbatim into the generate and tailor prompts

#### 0.5 — Write and lock the 3 prompts

Create each prompt as a plain `.txt` file in `backend/prompts/`. These are treated as locked contracts — to change a prompt you must create a new versioned file (e.g. `extract_v2.txt`) and update the reference in code explicitly. Never edit a prompt in place.

**`backend/prompts/extract.txt`**
```
# v1 — [date created]

You are a CV data extractor. You will be given raw text copied from a LinkedIn PDF export or a resume document.

Your job is to extract all information and return it as a single JSON object that exactly matches this schema:
[PASTE FULL SCHEMA HERE]

Rules:
- Return ONLY the JSON object. No explanation, no markdown, no code fences.
- If a field is not present in the text, use an empty string "" for strings or an empty array [] for arrays.
- Do not invent or infer information that is not explicitly stated.
- Dates must be in "Mon YYYY" format (e.g. "Jan 2021"). Use "Present" for current roles.
- Bullets must be extracted verbatim from the text — do not rewrite them at this stage.
- If no summary exists in the source, set summary to "".

Return nothing except the JSON object.
```

**`backend/prompts/generate.txt`**
```
# v1 — [date created]

You are a professional CV writer. You will be given a structured profile JSON object.

Your job is to rewrite the CV content to be strong, clean, and professional — then return it as a JSON object matching the same schema exactly.

Rules:
- Return ONLY the JSON object. No explanation, no markdown, no code fences.
- Rewrite bullet points to start with strong past-tense action verbs.
- Add metrics and numbers wherever they can be reasonably inferred from context.
- Do not invent companies, dates, degrees, or job titles — keep all facts accurate.
- Write the summary in third person, max 3 sentences, max 400 characters.
- Keep all skills as single words or short phrases.
- Strictly follow these content rules:
[PASTE CONTENTS OF docs/cv-rules.md HERE]

Return nothing except the JSON object.
```

**`backend/prompts/tailor.txt`**
```
# v1 — [date created]

You are a CV tailoring specialist. You will be given a CV JSON object and a job description.

Your job is to tailor the CV content to match the job description as closely as possible — then return the updated CV as a JSON object matching the same schema exactly.

Rules:
- Return ONLY the JSON object. No explanation, no markdown, no code fences.
- Reorder skills to place the most relevant ones for this job first.
- Rewrite bullet points to mirror the keywords and priorities in the job description.
- Adjust the summary to speak directly to this role.
- Do NOT change any company names, dates, job titles, or degrees — only rewrite descriptive content.
- Do NOT add skills or experience that are not already present in the CV.
- Strictly follow these content rules:
[PASTE CONTENTS OF docs/cv-rules.md HERE]

Return nothing except the JSON object.
```

- [ ] Create all 3 prompt files in `backend/prompts/`
- [ ] Replace `[PASTE FULL SCHEMA HERE]` with the actual schema JSON in `extract.txt`
- [ ] Replace `[PASTE CONTENTS OF docs/cv-rules.md HERE]` in `generate.txt` and `tailor.txt`
- [ ] Create `docs/prompts-guide.md` documenting the versioning rule: never edit in place, always create `_v2`

#### 0.6 — Groq API setup

- [ ] Create account at [console.groq.com](https://console.groq.com)
- [ ] Generate API key, store in `.env` as `GROQ_API_KEY`
- [ ] Test one raw API call with curl:

```bash
curl https://api.groq.com/openai/v1/chat/completions \
  -H "Authorization: Bearer $GROQ_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama-3.3-70b-versatile",
    "messages": [{"role": "user", "content": "Return this exact JSON and nothing else: {\"test\": true}"}],
    "temperature": 0.1
  }'
```

- [ ] Confirm you receive a response containing `{"test": true}` and nothing else
- [ ] Note the exact model string: `llama-3.3-70b-versatile` — use this in all API calls

**✓ Part 0 exit condition:** A Groq API call with a sample CV text (paste any CV as a string) returns a valid JSON object that passes your Pydantic schema validator with zero errors.

---

### Part 1 — Branding & design system

**Goal:** Define the complete visual language of the app and all 5 CV templates before writing any UI code.

#### 1.1 — Logo

- [ ] Decide on logo style: wordmark only ("ReadyToApply" typeset) or icon + wordmark
- [ ] Create logo in SVG format — one light version, one dark version
- [ ] Sizes needed: 32×32px icon (favicon), 120px wide (navbar), 240px wide (landing hero)
- [ ] Recommended tool: Figma (free tier is enough)
- [ ] Save finals to `frontend/public/logo.svg` and `frontend/public/logo-dark.svg`

#### 1.2 — Color palette & typography

Define all visual tokens in `frontend/styles/globals.css`. Nothing in the codebase uses hardcoded colors or font names — only these variables.

```css
:root {
  /* Brand */
  --color-primary: ;               /* Main CTA buttons, active states */
  --color-primary-hover: ;         /* 10% darker than primary */
  --color-primary-light: ;         /* Primary at 10% opacity — for tints */

  /* Neutrals */
  --color-bg: #ffffff;
  --color-bg-secondary: #f8f8f6;
  --color-border: #e5e5e2;
  --color-text-primary: #1a1a1a;
  --color-text-secondary: #6b6b6b;
  --color-text-hint: #a0a0a0;

  /* Feedback */
  --color-success: #16a34a;
  --color-error: #dc2626;
  --color-warning: #d97706;

  /* Typography */
  --font-sans: 'Your font', system-ui, sans-serif;

  /* Spacing scale */
  --space-1: 4px;   --space-2: 8px;   --space-3: 12px;
  --space-4: 16px;  --space-6: 24px;  --space-8: 32px;
  --space-12: 48px; --space-16: 64px;

  /* Radius */
  --radius-sm: 4px; --radius-md: 8px;
  --radius-lg: 12px; --radius-xl: 16px;
}
```

- [ ] Choose primary brand color (recommendation: confident blue `#2563eb` or near-black `#0f172a`)
- [ ] Choose font — import from Google Fonts. Recommendation: `Plus Jakarta Sans` or `DM Sans`
- [ ] Fill in all CSS variable values
- [ ] Define dark mode overrides under `@media (prefers-color-scheme: dark)`

#### 1.3 — CV template specifications

Design all 5 templates before writing any python-docx code. Document exact values in `docs/ats-rules.md`.

For each template define:

| Property | Must specify |
|---|---|
| Name | Classic / Modern / Sharp / Refined / Compact |
| Target user | e.g. Finance+Law / Tech+Product / Consulting |
| Body font | Calibri, Arial, Times New Roman, or Georgia only |
| Body font size | 9.5pt – 11pt |
| Heading font size | 11pt – 14pt |
| Line spacing | 1.0 – 1.15 |
| Margins (inches) | top / bottom / left / right |
| Section header style | ALL CAPS underline / bold border-bottom / etc. |
| Name display | Large centered or large left-aligned |
| Accent color | One color or pure black |

ATS constraints that apply to ALL 5 templates — document these in `docs/ats-rules.md`:

```
- No images, logos, or icons of any kind
- No text boxes — all text must be in the main document body
- No tables used for layout (tables only for actual tabular data)
- No headers or footers — all content in body
- Standard section names only:
    Work Experience (not "Where I've Been")
    Education (not "Academic Background")
    Skills (not "Technologies" or "What I Know")
    Certifications
- Fonts: Calibri, Arial, Times New Roman, or Georgia only
- No columns — single-column layout only
- No hyperlinks styled as buttons
```

- [ ] Template 1 — Classic: Times New Roman, traditional, finance/law
- [ ] Template 2 — Modern: Calibri, clean, tech/product
- [ ] Template 3 — Sharp: Arial, minimal, consulting
- [ ] Template 4 — Refined: Georgia, editorial, creative professionals
- [ ] Template 5 — Compact: Calibri 9.5pt, dense, senior professionals with many roles
- [ ] For each: write out every number (font size, margin, spacing) before touching code

#### 1.4 — UI wireframes

Wireframe every screen before building. Pen and paper is fine. The goal is to know exactly what you're building before you build it.

- [ ] Landing page: hero headline + subheadline, 3-step "how it works", 5 template previews, CTA
- [ ] Step 1 — Profile: two-tab layout (Upload PDF tab / Fill manually tab)
- [ ] Step 1 — Manual form: all fields, add/remove experience and education entries
- [ ] Step 2 — Job: textarea, character count, skip option
- [ ] Step 3 — Templates: 5 cards in a grid, thumbnail + name + audience tag
- [ ] Step 4 — Generate: generate button, loading state, download button, error state
- [ ] Mobile layout for all above (375px width)

#### 1.5 — Component inventory

List every reusable component. For each, note its variants and states before building.

- [ ] `Button` — variants: primary, secondary, ghost / states: default, hover, loading, disabled
- [ ] `FileUpload` — drag-and-drop + click to browse / states: empty, dragging, file selected, error
- [ ] `TextArea` — character counter / states: empty, typing, at-limit
- [ ] `Stepper` — 4 steps, current highlighted, completed checkmarked, future grayed
- [ ] `TemplateCard` — thumbnail, name, tag / states: default, selected
- [ ] `LoadingSpinner` — with optional status message
- [ ] `Toast` — error/success, auto-dismiss after 4s
- [ ] `FormField` — label + input + error message wrapper

**✓ Part 1 exit condition:** You can describe every screen, every template's exact font and spacing spec, and every component's props without opening a code editor.

---

### Part 2 — Backend core pipeline

**Goal:** Build and test the complete AI pipeline end-to-end with a single working template. Prove every piece works before scaling to 5 templates.

#### 2.1 — FastAPI project setup

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install fastapi uvicorn pdfplumber python-docx pydantic python-dotenv requests
pip freeze > requirements.txt
```

- [ ] Create `backend/main.py` with a health check: `GET /health` returns `{"status": "ok"}`
- [ ] Confirm it runs: `uvicorn main:app --reload`
- [ ] Create `backend/models/schema.py` with Pydantic models matching `docs/schema.json`
- [ ] Test that valid JSON passes and invalid JSON raises a clear error

#### 2.2 — LinkedIn PDF parser

File: `backend/services/parser.py`

```python
def parse_linkedin_pdf(file_bytes: bytes) -> str:
    # Returns clean raw text string
```

- [ ] Accept PDF as bytes
- [ ] Extract all text using `pdfplumber`
- [ ] Clean extracted text: strip excessive whitespace, fix encoding artifacts (`\uf0b7` bullet chars etc.)
- [ ] Return single clean string
- [ ] Test with 3 real LinkedIn PDF exports
- [ ] Handle errors gracefully: password-protected PDF, corrupted file, non-PDF type

#### 2.3 — LLM call 1: extract

File: `backend/services/extractor.py`

```python
def extract_profile(raw_text: str) -> ProfileSchema:
```

- [ ] Load `backend/prompts/extract.txt` at module init
- [ ] Call Groq API: model `llama-3.3-70b-versatile`, temperature `0.1`
- [ ] Parse response as JSON (strip any accidental markdown fences first)
- [ ] Pass through Pydantic validator
- [ ] If validation fails: retry once with a correction prompt that includes the specific error
- [ ] If retry fails: raise exception with details
- [ ] Return validated `ProfileSchema` object

#### 2.4 — LLM call 2: generate

File: `backend/services/generator.py`

```python
def generate_cv(profile: ProfileSchema) -> ProfileSchema:
```

- [ ] Load `backend/prompts/generate.txt`
- [ ] Serialize `ProfileSchema` to JSON string, pass as user message
- [ ] Call Groq API, temperature `0.3`
- [ ] Parse, validate, retry on failure (same pattern as extractor)
- [ ] Return validated `ProfileSchema` with improved content

#### 2.5 — LLM call 3: tailor

File: `backend/services/tailor.py`

```python
def tailor_cv(profile: ProfileSchema, job_description: str) -> ProfileSchema:
```

- [ ] Load `backend/prompts/tailor.txt`
- [ ] If `job_description` is empty or under 50 characters: return `profile` unchanged, skip API call
- [ ] Call Groq API, temperature `0.2`
- [ ] Parse, validate, retry on failure
- [ ] Return validated tailored `ProfileSchema`

#### 2.6 — JSON validator

File: `backend/services/validator.py`

- [ ] Validate all field types match schema
- [ ] Validate: summary ≤ 400 chars
- [ ] Validate: max 4 bullets per experience entry
- [ ] Validate: each bullet ≤ 120 chars
- [ ] Validate: max 12 skills
- [ ] Strip forbidden phrases from all text fields (from `docs/cv-rules.md`)
- [ ] Return cleaned, validated object — or raise `ValidationError` with specific field details

#### 2.7 — docx renderer (template 1 only)

Files: `backend/services/renderer.py`, `backend/templates/config.py`, `backend/templates/base.py`

- [ ] Create `TemplateConfig` dataclass with fields: `name`, `body_font`, `body_size`, `heading_size`, `line_spacing`, `margin_top`, `margin_bottom`, `margin_left`, `margin_right`, `accent_color`, `section_style`
- [ ] Create Template 1 config instance (Classic) with all values filled
- [ ] Build `setup_page(doc, config)` — sets margins and page size (US Letter: 8.5 × 11 inches)
- [ ] Build `add_name_header(doc, profile, config)` — name large, title below, contact on one line
- [ ] Build `add_section_header(doc, title, config)` — with bottom border, `keep_with_next` applied
- [ ] Build `add_summary(doc, text, config)` — body paragraph
- [ ] Build `add_experience_entry(doc, entry, config)` — company + dates on same line via tab stop, title italic below, bullets with `keep_together`
- [ ] Build `add_education_entry(doc, entry, config)`
- [ ] Build `add_skills(doc, skills, config)` — comma-separated inline
- [ ] Apply `keep_with_next` to all section headers
- [ ] Apply `prevent_page_break_inside` to all bullet paragraphs
- [ ] Build `render_cv(profile: ProfileSchema, template_id: int) -> bytes` — orchestrates all above, returns `.docx` as bytes
- [ ] Test: render a hardcoded `ProfileSchema` → save to `test_output.docx` → open in Word and inspect visually

#### 2.8 — API route

File: `backend/main.py`

Add `POST /generate`:
- [ ] Accepts multipart form: `pdf_file` (optional file), `profile_json` (optional string), `job_description` (string), `template_id` (int 1–5)
- [ ] If `pdf_file` provided: parser → extractor → generator → tailor → renderer
- [ ] If `profile_json` provided: skip parser + extractor, run generator → tailor → renderer
- [ ] Write output `.docx` to `/tmp/output_{uuid}.docx`
- [ ] Return as `FileResponse` with `media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document"`
- [ ] Return structured JSON errors on failure — never raw 500 stack traces

#### 2.9 — End-to-end test

- [ ] Open Postman
- [ ] `POST http://localhost:8000/generate` — form-data body, attach a real LinkedIn PDF, add job description string, set `template_id` to `1`
- [ ] Confirm response is a downloadable `.docx`
- [ ] Open the file in Word — verify it looks correct, properly paginated, no missing fields, no formatting errors

**✓ Part 2 exit condition:** A Postman call with a real LinkedIn PDF returns a clean, properly paginated `.docx` that looks professional when opened in Word.

---

### Part 3 — Templates & document quality

**Goal:** Build all 5 templates and harden the renderer against CVs of any length. No manual adjustment should ever be needed after generation.

#### 3.1 — Templates 2–5

- [ ] Add configs for Templates 2–5 to `backend/templates/config.py`
- [ ] Confirm all 5 configs have every required field filled (no None values except `accent_color`)
- [ ] Test all 5 templates render correctly with the same test `ProfileSchema`
- [ ] Open all 5 outputs in Word — verify each has a distinct visual style

#### 3.2 — Density check

- [ ] After generating docx, count total paragraphs in the document
- [ ] If count > 65: CV is likely spilling onto page 3
- [ ] If over threshold: append to the tailor prompt — `"Additionally: reduce each experience entry to maximum 3 bullets, shorten each bullet to maximum 90 characters, reduce summary to 2 sentences."` — and re-run tailor + render
- [ ] Test with a deliberately over-long CV (8+ jobs, maximum bullets)
- [ ] Confirm output stays within 2 pages

#### 3.3 — Edge case testing

Test every case below. All must produce a `.docx` that opens without errors.

- [ ] CV with only 1 job entry
- [ ] CV with 10+ job entries
- [ ] CV with no certifications (empty array)
- [ ] CV with very long company name (> 40 characters)
- [ ] CV with non-Latin characters in name (Arabic, French accented)
- [ ] Job description longer than 3000 characters
- [ ] Job description in French when CV is in English
- [ ] LinkedIn PDF with no work experience section at all
- [ ] All 5 templates tested with a medium-length CV (3–5 jobs)

#### 3.4 — Template preview thumbnails

- [ ] Generate one sample `.docx` per template using a realistic fictional profile
- [ ] Open each in Word, export/print as PDF
- [ ] Screenshot the first page of each
- [ ] Crop to just the CV area, save as PNG at 400×566px (A4 ratio approximately)
- [ ] Save to `frontend/public/previews/template-1.png` through `template-5.png`

**✓ Part 3 exit condition:** All 5 templates produce clean, professional output on CVs of any length with zero manual adjustment.

---

### Part 4 — Frontend

**Goal:** Build the complete user-facing app and connect it to the backend. After this part a real user can complete the full flow.

#### 4.1 — Next.js project setup

```bash
npx create-next-app@latest frontend --typescript --tailwind --app --no-src-dir
cd frontend
```

- [ ] Configure `next.config.js`: set `output: 'export'` for static build
- [ ] Copy CSS variables from Part 1.2 into `app/globals.css`
- [ ] Create `lib/api.ts` — base URL reads from `NEXT_PUBLIC_API_URL` env var
- [ ] Add `.env.local`: `NEXT_PUBLIC_API_URL=http://localhost:8000`
- [ ] Confirm `npm run dev` starts without errors and `http://localhost:3000` loads

#### 4.2 — Shared components

Build each in `components/` with full TypeScript props interface. Test in isolation before use in pages.

- [ ] `Button.tsx` — `variant: 'primary' | 'secondary' | 'ghost'`, `loading: boolean`, `disabled: boolean`
- [ ] `FileUpload.tsx` — drag and drop + click to browse, validates `.pdf` type and 5MB size limit, shows filename on selection
- [ ] `TextArea.tsx` — `maxLength: number`, shows character count, warning color above 80% of limit
- [ ] `Stepper.tsx` — `currentStep: 1 | 2 | 3 | 4`, completed steps show checkmark, future steps grayed
- [ ] `TemplateCard.tsx` — `templateId`, `name`, `audience`, `previewSrc`, `selected: boolean`
- [ ] `LoadingSpinner.tsx` — `message?: string` prop
- [ ] `Toast.tsx` — `type: 'success' | 'error'`, `message: string`, auto-dismisses after 4s
- [ ] `FormField.tsx` — `label`, `error?: string`, wraps any input element

#### 4.3 — Step 1: Profile input

State: `activeTab: 'upload' | 'manual'`

Upload tab:
- [ ] `FileUpload` component
- [ ] Accepted: `.pdf` only, max 5MB
- [ ] On selection: show filename + green checkmark + "Remove" button
- [ ] Store file in component state for submission

Manual entry tab:
- [ ] Fields: Full name, Current/target job title, Email, Phone, Location
- [ ] Experience section: add/remove job entries — each has company, title, location, start date, end date, up to 4 bullet points
- [ ] Education section: add/remove entries — institution, degree, field, year
- [ ] Skills: tag-style input — type and press Enter to add, click × to remove
- [ ] Certifications: optional section, add/remove — name, issuer, year
- [ ] All fields validate on blur
- [ ] "Continue" button disabled until at least name + one experience entry is filled

Both tabs produce the same data shape passed to Step 2.

#### 4.4 — Step 2: Job description

- [ ] Full-width textarea, min 6 rows, resizable
- [ ] Placeholder: "Paste the full job description here..."
- [ ] Character counter below — warning color above 3000 chars
- [ ] "Skip for now" link — advances without job description
- [ ] If skipped: store `job_description = ""` in state

#### 4.5 — Step 3: Template picker

- [ ] 5 `TemplateCard` components in responsive grid: 3 col desktop / 2 col tablet / 1 col mobile
- [ ] Each card shows thumbnail from `public/previews/`, name, target audience tag
- [ ] Click to select — selected card shows colored ring
- [ ] One must always be selected — default: Template 2 (Modern)
- [ ] "Continue" button below the grid

#### 4.6 — Step 4: Generate & download

Handle all 4 states:

| State | UI |
|---|---|
| Idle | "Generate my CV" button (primary, full width) |
| Loading | Button disabled, `LoadingSpinner` with rotating messages |
| Success | Green checkmark, "Download CV" button, "Start over" link |
| Error | Red error message, specific error text, "Try again" button |

- [ ] On generate: `POST /generate` with form data — file or profile JSON, job description, template_id
- [ ] Loading messages rotate every 4s: "Parsing your profile...", "Writing your CV...", "Tailoring to the job...", "Formatting your document..."
- [ ] On success: trigger file download from response blob, suggest filename `cv-readytoapply.docx`
- [ ] On error: show the specific error from the API response (not a generic message)
- [ ] Timeout: if no response after 55 seconds, show: "This is taking longer than usual. Please try again."

#### 4.7 — Landing page

File: `app/page.tsx`

- [ ] Hero: headline ("Your CV, tailored to every job. In 30 seconds."), subheadline, single CTA button → `/build`
- [ ] How it works: 3 illustrated steps — Upload profile / Paste the job / Download your CV
- [ ] Template showcase: all 5 preview thumbnails in a scrollable row with names
- [ ] Footer: "Built by [your name]" + GitHub link + Privacy policy link
- [ ] No pricing section — free at launch

#### 4.8 — Polish & build

- [ ] All pages mobile-responsive — test at 375px, 768px, 1280px
- [ ] Set `<title>` and `<meta description>` on all pages
- [ ] Favicon: export logo as 32×32 `.ico` and place in `app/favicon.ico`
- [ ] No console errors or TypeScript errors
- [ ] `npm run build` completes with zero errors

**✓ Part 4 exit condition:** The complete flow — upload LinkedIn PDF, paste job description, pick template, download CV — works in a browser without touching Postman or the terminal.

---

### Part 5 — AWS deployment

**Goal:** Deploy the full app to production AWS infrastructure using SST. Deploy before QA so you find infrastructure-specific bugs during testing, not after launch.

#### 5.1 — AWS account setup

- [ ] Create AWS account at [aws.amazon.com](https://aws.amazon.com)
- [ ] Enable MFA on root account immediately after creation
- [ ] Create IAM user named `readytoapply-deploy` with programmatic access only
- [ ] Attach policies: `AWSLambda_FullAccess`, `AmazonS3FullAccess`, `AmazonAPIGatewayAdministrator`, `CloudFrontFullAccess`, `IAMFullAccess`
- [ ] Download credentials CSV — this is shown once only
- [ ] Install AWS CLI: `brew install awscli` or [docs.aws.amazon.com/cli](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html)
- [ ] Configure: `aws configure` — enter access key, secret, region `eu-west-1`, output `json`
- [ ] Verify: `aws sts get-caller-identity` returns your account ID without error

#### 5.2 — Backend Dockerfile

File: `backend/Dockerfile`

```dockerfile
FROM public.ecr.aws/lambda/python:3.11

COPY requirements.txt .
RUN pip install -r requirements.txt --no-cache-dir

COPY . .

CMD ["main.handler"]
```

- [ ] Add `mangum` to `requirements.txt`
- [ ] Add to bottom of `backend/main.py`:
  ```python
  from mangum import Mangum
  handler = Mangum(app, lifespan="off")
  ```
- [ ] Test Docker build: `docker build -t readytoapply-backend ./backend`
- [ ] Test Docker run: `docker run -p 9000:8080 --env-file backend/.env readytoapply-backend`
- [ ] Test with curl:
  ```bash
  curl -XPOST "http://localhost:9000/2015-03-31/functions/function/invocations" \
    -d '{"path":"/health","httpMethod":"GET","headers":{},"body":null}'
  ```
- [ ] Confirm health check returns `{"status": "ok"}`

#### 5.3 — SST setup

```bash
# In repo root
npm install sst
npx sst init
```

- [ ] Confirm `sst.config.ts` created in repo root

#### 5.4 — SST stack definition

File: `sst.config.ts`

```typescript
import { SSTConfig } from "sst";
import { Function, Bucket, ApiGatewayV2, StaticSite } from "sst/constructs";
import { Duration } from "aws-cdk-lib";

export default {
  config(_input) {
    return {
      name: "readytoapply",
      region: "eu-west-1",
    };
  },
  stacks(app) {
    app.stack(function Site({ stack }) {

      const outputBucket = new Bucket(stack, "OutputBucket", {
        cdk: {
          bucket: {
            lifecycleRules: [{
              expiration: Duration.hours(1),
            }],
          },
        },
      });

      const api = new Function(stack, "Api", {
        handler: "backend/",
        container: true,
        timeout: 60,
        memorySize: 1024,
        environment: {
          S3_OUTPUT_BUCKET: outputBucket.bucketName,
          GROQ_API_KEY: process.env.GROQ_API_KEY!,
        },
        permissions: [outputBucket],
      });

      const apiGateway = new ApiGatewayV2(stack, "ApiGateway", {
        routes: {
          "POST /generate": api,
          "GET /health": api,
        },
      });

      const site = new StaticSite(stack, "Frontend", {
        path: "frontend",
        buildOutput: "out",
        buildCommand: "npm run build",
        environment: {
          NEXT_PUBLIC_API_URL: apiGateway.url,
        },
      });

      stack.addOutputs({
        ApiUrl: apiGateway.url,
        SiteUrl: site.url,
      });
    });
  },
} satisfies SSTConfig;
```

- [ ] Set SST secrets: `npx sst secrets set GROQ_API_KEY your_key_here`
- [ ] Review IAM — Lambda needs `s3:PutObject` and `s3:GetObject` on the output bucket

#### 5.5 — Deploy

```bash
npx sst deploy --stage prod
```

- [ ] First deploy takes 5–10 minutes (CloudFront distribution provisioning)
- [ ] Note the `ApiUrl` and `SiteUrl` outputs printed at the end
- [ ] In AWS Lambda console: confirm timeout is 60s and memory is 1024MB
- [ ] Check CloudWatch Logs for the Lambda function — confirm no startup errors

#### 5.6 — DNS & domain

- [ ] Log into Cloudflare, add your domain, update nameservers at your registrar
- [ ] In AWS Certificate Manager (ACM) — **must be in `us-east-1` region** — request a public certificate for `readytoapply.com` and `www.readytoapply.com`
- [ ] Validate via DNS: ACM gives you CNAME records to add in Cloudflare DNS
- [ ] Wait for certificate status: `Issued` (up to 30 minutes)
- [ ] In CloudFront distribution settings: add your domain as an alternate CNAME, attach the certificate
- [ ] In Cloudflare DNS: add CNAME record `@` → your CloudFront distribution URL, proxy off (DNS only)
- [ ] Test: `https://readytoapply.com` loads the frontend with a valid SSL padlock

#### 5.7 — Smoke test

- [ ] `GET https://[your-api-url]/health` returns `{"status": "ok"}`
- [ ] Full flow from public URL: upload real LinkedIn PDF → receive and download CV
- [ ] Test on mobile phone (not desktop, not localhost)
- [ ] Test from a different network (phone data, not home WiFi)

**✓ Part 5 exit condition:** A person with no access to your machine can complete the full flow from `https://readytoapply.com`.

---

### Part 6 — QA, polish & launch

**Goal:** Find and fix every edge case before inviting the public. Ship only when it is solid.

#### 6.1 — Systematic testing

- [ ] Test with 10 different real LinkedIn PDF exports (ask friends, use your own)
- [ ] Required variety: 1 job only, 3–5 jobs, 7+ jobs, career change, fresh graduate, non-English name
- [ ] Test all 5 templates on each of the above profiles
- [ ] Test with no job description (skip flow)
- [ ] Test with a very short job description (under 100 characters)
- [ ] Test with a job description in French (common in Tunisia)
- [ ] Test manual entry form: all fields filled
- [ ] Test manual entry form: only required fields
- [ ] Log every bug as a GitHub Issue before fixing it

#### 6.2 — Performance benchmarks

- [ ] Measure average generation time end-to-end: target under 30 seconds
- [ ] If over 30s: identify the slowest LLM call with timestamps in logs
- [ ] Lambda cold start: measure first-request latency after 10 minutes idle — should be under 4 seconds
- [ ] Concurrent load: open 3 browser tabs, submit simultaneously — all 3 must succeed

#### 6.3 — Rate limiting

- [ ] In AWS API Gateway console: create a Usage Plan with throttling — 20 requests per IP per hour
- [ ] Attach the Usage Plan to your API stage
- [ ] Test: submit 21 requests in quick succession, confirm the 21st returns HTTP 429
- [ ] Ensure the 429 response body is: `{"error": "Too many requests. Please try again in an hour."}`

#### 6.4 — CI/CD

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: '3.11' }
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - name: Install backend deps
        run: pip install -r backend/requirements.txt
      - name: Deploy via SST
        run: npx sst deploy --stage prod
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          GROQ_API_KEY: ${{ secrets.GROQ_API_KEY }}
```

- [ ] Add `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `GROQ_API_KEY` to GitHub repo secrets
- [ ] Push a small change to `main`, confirm GitHub Actions deploys successfully end-to-end

#### 6.5 — Monitoring

- [ ] In AWS CloudWatch: create alarm for Lambda error rate > 5% in any 5-minute window
- [ ] Create alarm for Lambda p99 duration > 50 seconds
- [ ] Set alarm action: send email notification to your address
- [ ] After going live: review CloudWatch logs at 24h and 72h to catch any unexpected errors

#### 6.6 — Privacy policy

Create `frontend/app/privacy/page.tsx`. The policy must cover:

- [ ] What data is collected: CV content text and job description text, processed transiently
- [ ] Retention: data is not stored — deleted immediately after the `.docx` is generated
- [ ] Third parties: Groq API processes the text to generate AI output (name them explicitly)
- [ ] No data sold or shared with any other third parties
- [ ] Contact email for data requests or deletion
- [ ] Link privacy policy in the landing page footer

#### 6.7 — Pre-launch checklist

- [ ] All 5 templates generate clean output on all test profiles ✓
- [ ] Mobile layout tested on real iOS and Android devices ✓
- [ ] Privacy policy page live ✓
- [ ] Custom domain with HTTPS working ✓
- [ ] No console errors in production build ✓
- [ ] CloudWatch alerts configured ✓
- [ ] Rate limiting active and tested ✓
- [ ] GitHub Actions CI/CD working ✓
- [ ] README up to date ✓
- [ ] Repo is public ✓

#### 6.8 — Launch

Post in this order on the same day, a few hours apart to spread engagement:

- [ ] **LinkedIn** — personal story: "I built a tool that tailors your CV to any job in 30 seconds. Here's how it works and why I built it..." + screenshot of a generated CV + link
- [ ] **Reddit r/cscareerquestions** — "I built a free CV tailoring tool, would love honest feedback" — genuine tone, not promotional
- [ ] **Reddit r/jobs** — same post adapted slightly
- [ ] **Twitter/X** — 30-second screen recording of the full flow + link
- [ ] **Product Hunt** — submit as a product (requires account, prepare listing and screenshots in advance)

**✓ Part 6 exit condition:** App is live, stable, publicly shared, and you have received at least one piece of external user feedback.

---

## Running locally

```bash
# Clone
git clone https://github.com/yourusername/readytoapply.git
cd readytoapply

# Backend
cd backend
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp ../.env.example .env
# Fill in GROQ_API_KEY in .env
uvicorn main:app --reload --port 8000

# Frontend (new terminal)
cd frontend
npm install
# Create .env.local with: NEXT_PUBLIC_API_URL=http://localhost:8000
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Contributing

Issues and PRs are welcome.

1. Fork the repo
2. Create a branch off `dev`: `git checkout -b feature/your-feature`
3. Commit with a clear message: `git commit -m "feat: your feature"`
4. Open a PR against `dev`, not `main`

---

## License

MIT — see [LICENSE](LICENSE)

---

*Start with Part 0. Do not skip the exit condition of any part.*
