# CVcraft

> Paste your LinkedIn export or fill your info once. Get a tailored, ATS-clean CV in seconds — every time you apply.

---

## What it does

CVcraft takes your profile (from a LinkedIn PDF export or manual entry), a job description you paste, and a template you choose — and generates a properly formatted, ATS-friendly CV as a `.docx` file in under 30 seconds. No accounts, no subscriptions, no stored data.

---

## Build plan

The app is built in 7 sequential parts. Each part has a clear exit condition — you do not move to the next part until that condition is met.

---

### Part 0 — Foundation & blueprint
**Before you write any code**

Lock the contracts everything else depends on. The JSON schema the AI returns, the rules each prompt must enforce, and the content constraints the renderer expects — all of these must be defined before touching code. Changing them later breaks both backend and prompts simultaneously.

| Task | Notes |
|---|---|
| Create GitHub repo | Set up `main` + `dev` branches |
| Pick and register app name / domain | Decide early, branding flows from this |
| Define the fixed profile JSON schema | Every AI call must return this exact shape |
| Write the 3 prompt templates | Extract, generate, tailor — with output format locked |
| Document CV content rules | Max bullets, max chars per bullet, section order, forbidden phrases |
| Set up Groq account | Free tier, get API key, test one call locally |
| Create `.env.example` | Every required env var listed, no values |

**✓ Exit condition:** A single Groq API call returns valid JSON that matches your defined schema.

---

### Part 1 — Branding & design system
**Design before you build**

The 5 CV template designs determine what data fields the renderer needs. Design them first — building the renderer before the designs means you will rebuild it.

| Task | Notes |
|---|---|
| Pick app name + create logo | Wordmark or simple icon |
| Define color palette, font, spacing | Single CSS variables file — one source of truth |
| Design all 5 CV template layouts | On paper or Figma, before any code |
| Document ATS constraints per template | No images, standard fonts, no layout tables |
| Wireframe the 4-step app flow | Profile → job → template → download |
| Define reusable component list | Buttons, inputs, stepper, file upload, template card |

**✓ Exit condition:** You can describe every screen and every template in detail without opening a code editor.

---

### Part 2 — Backend core pipeline
**The full AI pipeline, one template**

Build the entire pipeline end-to-end with a single template first. Proving the pipeline works before building all 5 templates avoids rebuilding the renderer multiple times.

| Task | Notes |
|---|---|
| Set up FastAPI project | Install dependencies, confirm it runs locally |
| Build LinkedIn PDF parser | Extract raw text with `pdfplumber` |
| Build LLM call 1 — extract | Structured profile JSON from raw PDF text |
| Build LLM call 2 — generate | Clean base CV from profile JSON |
| Build LLM call 3 — tailor | Adjust CV content to match a job description |
| Build JSON validator | Catch schema violations, re-prompt automatically |
| Build docx renderer (1 template) | `python-docx`, pagination rules, keep-with-next |
| Test end-to-end with Postman | Upload PDF → receive `.docx` |

**✓ Exit condition:** A Postman call with a real LinkedIn PDF returns a clean, properly paginated `.docx`.

---

### Part 3 — Templates & document quality
**All 5 templates, edge case handling**

Build the remaining 4 templates and harden the renderer against CVs of any length. Each template is a different Python config (font, spacing, layout) passed into the same rendering functions.

| Task | Notes |
|---|---|
| Build 4 remaining template renderer configs | Font, size, color, spacing as a config object per template |
| Add density check | Detect overflow beyond 2 pages, trigger compact re-prompt |
| Add section header orphan rule | Section headers never alone at bottom of page |
| Test all 5 templates | Short (1 job), medium (3–5 jobs), long (7+ jobs) |
| Generate template preview thumbnails | Static images for the UI template picker |

**✓ Exit condition:** All 5 templates produce clean output on CVs of any length without manual adjustment.

---

### Part 4 — Frontend
**The user-facing app**

The frontend is a single-page multi-step flow. State lives in React memory only — nothing is persisted between sessions at this stage.

| Task | Notes |
|---|---|
| Set up Next.js + Tailwind | Configure env vars pointing to backend |
| Step 1 — profile input | LinkedIn PDF upload + manual entry form (same output) |
| Step 2 — job description | Textarea for pasting job posting |
| Step 3 — template picker | Cards with preview thumbnails, select one |
| Step 4 — generate + download | Loading state, presigned S3 URL → file download |
| Wire all steps to backend API | Handle loading, error, and success states |
| Landing page | What it does, how it works, single CTA |
| Mobile-responsive layout | All steps usable on phone |

**✓ Exit condition:** The full flow works in a browser from upload to download without touching Postman.

---

### Part 5 — AWS deployment
**Ship to real infrastructure**

Deploy before QA — you want to find infrastructure-specific bugs during testing, not after launch. Everything is provisioned via SST in a single config file.

| Task | Notes |
|---|---|
| Create AWS account + IAM user | Least-privilege policy only |
| Write Dockerfile for FastAPI | Docker Lambda container (removes 50MB package size limit) |
| Install and configure SST | Infrastructure as code, version controlled |
| Write SST stack | Lambda + API Gateway + output S3 bucket + CloudFront |
| Configure S3 lifecycle rule | Auto-delete output files after 1 hour |
| Store secrets properly | `GROQ_API_KEY` etc. via SST secrets or AWS Secrets Manager |
| Run `sst deploy` | Verify all infrastructure provisions without errors |
| Deploy frontend | Next.js static export → S3 + CloudFront |
| Set Lambda config | Timeout: 60s · Memory: 1024MB |
| Smoke test on live URLs | Full flow from real public URL |

**✓ Exit condition:** A person with no access to your machine can complete the full flow from a public URL.

---

### Part 6 — QA, polish & launch
**Harden before you share it**

| Task | Notes |
|---|---|
| Test with 10+ real LinkedIn PDFs | Different lengths, formats, languages |
| Test edge cases | Very short CVs, very long CVs, non-English names, symbols |
| Add basic rate limiting | Max N requests per IP per hour at API Gateway level |
| Set up GitHub Actions CI | Tests run on every push to `main` |
| Set up CloudWatch alerts | Trigger on Lambda errors and timeout spikes |
| Write privacy policy | Required — you handle full employment history and contact data |
| Custom domain (optional) | Route 53 + CloudFront — recommended before sharing publicly |
| Launch | LinkedIn, Reddit (`r/cscareerquestions`, `r/jobs`), Twitter/X |

**✓ Exit condition:** App is live, stable under basic load, and publicly shared.

---

## Tech stack

| Layer | Technology | Why |
|---|---|---|
| Frontend | Next.js + Tailwind CSS | Static export, deploys to S3/CloudFront trivially |
| Backend | Python FastAPI | Best ecosystem for PDF parsing and docx generation |
| AI | Groq API — Llama 3.3 70B | Free tier, fast, sufficient quality for structured tasks |
| Document generation | `python-docx` | Full programmatic control over every formatting detail |
| PDF parsing | `pdfplumber` | Best accuracy on LinkedIn's export format |
| Infrastructure | AWS (Lambda + API Gateway + S3 + CloudFront) | Scales to zero cost at MVP traffic |
| IaC | SST | Single config file provisions entire stack |

---

## Repo structure

```
/
├── frontend/               # Next.js app
│   ├── app/
│   │   ├── page.tsx        # Landing page
│   │   └── build/
│   │       └── page.tsx    # 4-step flow
│   └── components/
│       ├── StepProfile.tsx
│       ├── StepJob.tsx
│       ├── StepTemplate.tsx
│       └── StepDownload.tsx
│
├── backend/                # FastAPI app
│   ├── main.py             # Routes
│   ├── services/
│   │   ├── parser.py       # PDF text extraction
│   │   ├── extractor.py    # LLM call 1 — profile JSON
│   │   ├── generator.py    # LLM call 2 — base CV
│   │   ├── tailor.py       # LLM call 3 — job tailoring
│   │   ├── validator.py    # JSON schema enforcement
│   │   └── renderer.py     # python-docx template engine
│   ├── templates/          # 5 docx template configs
│   └── Dockerfile
│
├── sst.config.ts           # Full AWS infrastructure definition
├── .env.example
└── README.md
```

---

## Environment variables

```env
# AI
GROQ_API_KEY=

# AWS (set via SST secrets in production, .env locally)
AWS_REGION=
S3_OUTPUT_BUCKET=

# Backend
MAX_REQUESTS_PER_HOUR=20
LAMBDA_TIMEOUT_SECONDS=60
```

---

*Start with Part 0. Do not skip the exit condition.*
