<!-- BEGIN:nextjs-agent-rules -->
# AGENTS.md — ReadyToApply Frontend

This file governs how AI coding agents (Claude, Cursor, Copilot, etc.) should
behave when working on the ReadyToApply frontend. Read this entire file before
writing or editing any code.

---

## Project overview

ReadyToApply is a CV tailoring tool. Users upload their LinkedIn PDF, paste a
job description, pick a template, and download a tailored ATS-clean CV as a
.docx file. The frontend is a Next.js 16 app with Tailwind CSS.

---

## Stack — do not deviate

- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS only — no CSS modules, no styled-components, no
  inline style objects unless absolutely necessary for dynamic values
- **Language**: TypeScript — all files must be .tsx or .ts, no .js or .jsx
- **Icons**: lucide-react only — no emoji, no other icon libraries
- **Fonts**: loaded via next/font — defined once in layout.tsx, used via
  CSS variables everywhere else
- **State**: React useState and useReducer only — no Redux, no Zustand, no
  external state libraries for the MVP
- **HTTP**: native fetch only — no axios, no react-query for the MVP
- **Animations**: Tailwind transition/animation classes + CSS keyframes in
  globals.css — no Framer Motion for the MVP

---

## Design system

### Brand

- **Product name**: ReadyToApply — always written exactly like this, never
  abbreviated to RTA or any other form in UI copy
- **Tagline**: "Your CV, tailored in seconds."

### Color palette — CSS variables defined in globals.css

```css
--color-flame:     #FF4D00;   /* primary CTA, key accents */
--color-ember:     #FF8C42;   /* secondary accents, hover states */
--color-coal:      #111111;   /* primary text, dark backgrounds */
--color-ash:       #1C1C1C;   /* card backgrounds on dark surfaces */
--color-smoke:     #2E2E2E;   /* borders, dividers on dark */
--color-chalk:     #F5F0EB;   /* light background, off-white */
--color-bone:      #E8E0D5;   /* subtle surface on light backgrounds */
--color-mist:      #9A9A9A;   /* secondary text, placeholders */
```

### Typography

- **Display font**: Syne (Google Font) — used for headings and the brand name
- **Body font**: DM Sans (Google Font) — used for all body text, labels, inputs
- Never use Inter, Roboto, Arial, or system fonts anywhere

### Visual direction

The aesthetic is **editorial-industrial** — bold typography, high contrast,
structured layouts with deliberate asymmetry. Think design studio portfolio
meets SaaS tool. Dark backgrounds with flame orange accents. Not heavy. Not
corporate. Not playful. Sharp.

Key rules:
- Dark theme is the default (coal background, chalk text)
- Use geometric abstract shapes as decorative elements — no illustrations,
  no photography, no emojis
- Generous whitespace — never crowded
- One dominant accent per section (flame orange) — do not scatter color
- Borders and lines are used deliberately as structural elements
- Hover states must always be present on interactive elements
- No drop shadows unless they serve a clear structural purpose
- No gradients except on the hero section background (subtle radial,
  flame to transparent)

---

## Routing structure

```
/                          → Landing page
/build                     → 4-step CV generation flow
/build?step=1              → Step 1: Upload profile
/build?step=2              → Step 2: Job description
/build?step=3              → Step 3: Template picker
/build?step=4              → Step 4: Generate + download
```

---

## Component rules

### File structure

```
frontend/
  app/
    page.tsx               → Landing page
    build/
      page.tsx             → Step flow controller (manages step state)
    layout.tsx             → Root layout, fonts, metadata
  components/
    StepProfile.tsx        → Step 1
    StepJob.tsx            → Step 2
    StepTemplate.tsx       → Step 3
    StepDownload.tsx       → Step 4
    StepIndicator.tsx      → Progress bar shown across all steps
  lib/
    api.ts                 → All backend fetch calls — never call fetch
                             directly from a component
  styles/
    globals.css            → CSS variables, keyframes, base resets
```

### Component rules

- One component per file — no exceptions
- Props must always be typed with a TypeScript interface defined at the top
  of the file
- No default exports for utility functions — named exports only
- Components may not call the backend directly — all API calls go through
  lib/api.ts
- Never hardcode strings that appear in the UI — all user-facing copy goes
  in a constants or i18n file (see Internationalisation below)

---

## Internationalisation (i18n)

The app supports English and French. Both languages must be present from day
one — do not build in English and "add French later".

- Use next-intl for i18n
- All UI copy lives in messages/en.json and messages/fr.json
- Never hardcode UI strings in components
- Language toggle is always visible in the nav — a simple EN / FR text toggle,
  no flags
- Default locale: en

---

## The 4-step flow

### Step 1 — Profile upload
- Two tabs: "Upload PDF" and "Paste text"
- Upload tab: drag-and-drop zone + click to browse, accepts .pdf only,
  max 5MB, shows filename once selected
- Paste tab: large textarea, placeholder text in both languages
- Validation: must have either a file or pasted text before proceeding
- Error state: red border + error message below the input

### Step 2 — Job description
- Single large textarea
- Character counter visible (no hard limit, just informational)
- Placeholder: "Paste the full job description here"
- Validation: minimum 50 characters before proceeding

### Step 3 — Template picker
- Show 1 template card for MVP (classic)
- Card shows: template name, a visual preview placeholder (abstract geometric
  representation of a CV layout — not a screenshot)
- Selected state: flame orange border
- More templates coming soon state shown as locked cards with "Coming soon"

### Step 4 — Generate + download
- Single "Generate CV" button
- Loading state: button becomes a progress indicator with a status message
  that cycles through the 3 AI stages:
    - "Extracting your profile..."
    - "Writing your CV..."
    - "Tailoring to the job..."
- Success state: download button appears, green checkmark icon, filename shown
- Error state: red error card showing the reason the generation failed
  (use the detail field from the API error response) + a "Try again" button
- Never show a raw error object or stack trace to the user

---

## API integration — lib/api.ts

The backend runs at the URL stored in NEXT_PUBLIC_API_URL env variable.

```typescript
// All functions in lib/api.ts must follow this pattern:

export async function generateCV(
  file: File | null,
  pastedText: string | null,
  jobDescription: string,
  template: string
): Promise<Blob> {
  // returns the .docx file as a Blob
  // throws an Error with a human-readable message on failure
  // the error message must come from the API response detail field
}
```

Rules:
- All fetch calls use FormData
- On non-2xx response: parse the JSON body, extract detail, throw Error(detail)
- On network failure: throw Error("Network error. Please check your connection.")
- The function must never return undefined — either return the Blob or throw

---

## Error handling rules

- Every error shown to the user must be in plain language
- Never show: stack traces, raw JSON, HTTP status codes, internal error keys
- Every error state must include a recovery action (retry button, or clear
  and start over)
- Console.error is allowed for debugging but must not replace user-facing
  error messages

---

## Accessibility

- All interactive elements must have visible focus states
- All images and icons used decoratively must have aria-hidden="true"
- Form inputs must have associated labels (use sr-only if label is visually
  hidden)
- Color contrast must meet WCAG AA minimum
- The step flow must be keyboard-navigable

---

## Responsive design

- Mobile-first — build for 375px width first, then scale up
- Breakpoints: sm (640px), md (768px), lg (1024px) — Tailwind defaults
- The 4-step flow must be fully usable on mobile
- The landing page hero layout shifts from stacked (mobile) to side-by-side
  (desktop)
- Minimum tap target size: 44x44px for all interactive elements

---

## Performance rules

- No unused dependencies — check before installing anything new
- Images must use next/image
- Fonts must use next/font with display: swap
- No client components unless interactivity is required — prefer server
  components by default
- Add "use client" only when needed — document why in a comment above it

---

## What agents must never do

- Never install a UI component library (shadcn, MUI, Chakra, etc.)
- Never use inline style objects for static values — use Tailwind classes
- Never hardcode the API URL — always use process.env.NEXT_PUBLIC_API_URL
- Never use emojis anywhere in the UI
- Never use purple, blue, or green as primary colors — the palette is defined
  above and must not be extended without explicit instruction
- Never skip TypeScript types — no `any` types allowed
- Never write components longer than 150 lines — split into smaller components
- Never add placeholder lorem ipsum content to production components
- Never commit the .env.local file
<!-- END:nextjs-agent-rules -->
