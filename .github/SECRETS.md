# Required GitHub Secrets

Set these in: GitHub repo → Settings → Secrets and variables → Actions

| Secret | Where to get it |
|--------|----------------|
| `VERCEL_TOKEN` | vercel.com → Account Settings → Tokens |
| `VERCEL_ORG_ID` | `vercel.json` or `vercel whoami --json` after `vercel link` |
| `VERCEL_PROJECT_ID` | `frontend/.vercel/project.json` → `projectId` |
| `RENDER_DEPLOY_HOOK_URL` | Render dashboard → your service → Settings → Deploy Hook |

## Render setup

1. Create a new **Web Service** on Render
2. Connect your GitHub repo, set root directory to `backend`
3. Runtime: **Docker** (uses the existing `backend/Dockerfile`)
4. Set environment variable: `GROQ_API_KEY=your_key`
5. Copy the Deploy Hook URL → add as `RENDER_DEPLOY_HOOK_URL` secret

## Vercel setup

1. Run `vercel link` inside `frontend/` once to generate `.vercel/project.json`
2. The `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` are in that file
