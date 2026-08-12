# Tax Copilot

An MVP for a Tanzania-first AI tax filing assistant: upload documents → AI
extracts the numbers → you review → get a ready-to-file return. No
submission to TRA yet — that's deliberately out of scope for v1.

```
tax-copilot/
├── backend/    Node.js + Express API, PostgreSQL via Prisma
└── frontend/   Next.js 14 app (App Router) + Tailwind
```

## What's actually implemented

- **Auth**: email/password accounts backed by PostgreSQL via the
  backend auth API. The backend verifies session tokens and keeps a
  local user record for persistence, so signup and login behave
  consistently across restarts and deployments.
- **Document upload**: PDF/JPG/PNG, stored locally by default, with a
  one-line swap to Supabase Storage (`STORAGE_DRIVER=supabase`).
- **OCR + AI field extraction**: runs in **mock mode** out of the box —
  no API keys needed to see the full pipeline work. Add `OPENAI_API_KEY`
  and/or `GOOGLE_VISION_API_KEY` to your `.env` to go live.
- **Tax calculator**: real TRA resident PAYE bands, configurable in
  `backend/src/config/taxBrackets.js`, with a full band-by-band
  breakdown returned to the UI. **These bands need to be checked against
  the current TRA schedule before this is used for anything real** —
  Finance Act changes shift them most years.
- **Deduction finder**: flags amounts found in uploaded receipts and
  lets you accept them as deductions.
- **PDF generation**: a real downloadable tax return summary.

## Local development

### 1. Backend

```bash
cd backend
cp .env.example .env


npm install
npm run prisma:migrate   
npm run dev              
```

Don't have Postgres locally? Easiest path is a free instance from
[Vercel Postgres](https://vercel.com/docs/postgres), [Neon](https://neon.tech),
or another managed provider — just paste the connection string into
`DATABASE_URL`.

### 2. Frontend

```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev                
```

Open `http://localhost:3000`, register an account, create a return, and
upload a sample salary slip (any PDF/JPG works — mock mode ignores the
actual content and returns realistic sample fields so you can see the
whole flow).

## Deploying to Vercel

The repo includes a root [`vercel.json`](vercel.json) that deploys the Next.js
frontend and Express backend together as [Vercel Services](https://vercel.com/docs/services)
on one domain (`/` → frontend, `/api/*` → backend).

### Recommended: unified deploy (one Vercel project)

1. Push this repo to GitHub.
2. In Vercel: **Add New → Project → Import** the repo.
3. Leave the **root directory** as `.` (repo root).
4. In **Build & Deployment → Framework Preset**, choose **Services**.
5. **Before the first deploy**, add environment variables (Project Settings → Environment Variables).
   At minimum you need `DATABASE_URL` — without it the build will succeed but
   migrations are skipped and the API will not work at runtime.

   **Shared / backend**
   - `DATABASE_URL` — **required**. Postgres connection string ([Vercel Postgres](https://vercel.com/docs/postgres), [Neon](https://neon.tech), etc.). Enable for Production, Preview, and Development.
   - `JWT_SECRET` — long random string
   - `FRONTEND_ORIGIN` — your Vercel deployment URL (e.g. `https://tax-copilot.vercel.app`)
   - `STORAGE_DRIVER=supabase` — required on Vercel (local disk is ephemeral)
   - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET`
   - `OPENAI_API_KEY` / `GOOGLE_VISION_API_KEY` (optional; mock mode works without them)

   **Frontend (Supabase auth)**
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`)

   Do **not** set `NEXT_PUBLIC_API_URL` for unified deploy — the frontend
   calls `/api` on the same origin automatically.

6. Deploy. When `DATABASE_URL` is set, the backend build runs
   `prisma generate` and `prisma migrate deploy` automatically.

### Alternative: split deploy (two Vercel projects)

Use this if you prefer separate scaling or domains for frontend and backend.

**Backend project** — root directory: `backend`
- Uses [`backend/vercel.json`](backend/vercel.json) (Express auto-detected from `src/app.js`)
- Set all backend env vars from `backend/.env.example`
- Set `FRONTEND_ORIGIN` to your frontend Vercel URL

**Frontend project** — root directory: `frontend`
- Set `NEXT_PUBLIC_API_URL` to your backend Vercel URL
- Set Supabase `NEXT_PUBLIC_*` vars from `frontend/.env.local.example`
- After deploy, confirm `FRONTEND_ORIGIN` on the backend matches the frontend URL

## Known limitations / next steps

- JWT is stored in `localStorage` on the frontend — fine for an MVP demo,
  but move to an httpOnly cookie before handling real tax documents.
- The auth API requires a reachable PostgreSQL database; if the database
  is down, signup/login now returns a clear 503 instead of silently
  creating an ephemeral in-memory account.
- OCR/AI extraction is mock-mode until you add API keys; real-mode
  OpenAI extraction in `aiExtractionService.js` is wired up but untested
  against actual scanned documents — expect to tune the prompt.
- Deduction categories in `taxBrackets.js` are a starting taxonomy, not
  a verified list of what TRA currently allows as PAYE deductions —
  review before relying on them.
- No direct TRA filing integration (by design, per the MVP scope) —
  `ReturnStatus.FILED` exists in the schema as a placeholder for later.
- No automated tests yet. The tax engine and extraction pipeline were
  smoke-tested manually during development; worth adding a test suite
  before this handles real user data.
