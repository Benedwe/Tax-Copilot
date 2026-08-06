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

- **Auth**: email/password (JWT). Google sign-in is stubbed with a clear
  TODO — wire up Firebase Admin to verify ID tokens when you're ready.
- **Document upload**: PDF/JPG/PNG, stored locally by default, with a
  one-line swap to Firebase Storage (`STORAGE_DRIVER=firebase`).
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
[Railway](https://railway.app) or [Neon](https://neon.tech) — just paste
the connection string into `DATABASE_URL`.

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

## Deploying

### Backend → Railway

1. Push this repo to GitHub.
2. In Railway: **New Project → Deploy from GitHub repo**, select
   `/backend` as the root directory.
3. Add a **PostgreSQL** plugin to the project — Railway will inject
   `DATABASE_URL` automatically.
4. Set the remaining env vars from `.env.example` (`JWT_SECRET`,
   `FRONTEND_ORIGIN` = your Vercel URL, and `OPENAI_API_KEY` /
   `GOOGLE_VISION_API_KEY` once you're ready to leave mock mode).
5. Railway will run `npm install` (which triggers `prisma generate` via
   `postinstall`) and then the `railway.json` start command, which runs
   pending migrations before starting the server.

### Frontend → Vercel

1. **New Project → Import** the same repo, set `/frontend` as the root
   directory (Vercel auto-detects Next.js).
2. Add the env var `NEXT_PUBLIC_API_URL` = your Railway backend URL.
3. Deploy. Once it's live, go back to Railway and set `FRONTEND_ORIGIN`
   to the Vercel URL so CORS allows it.

## Known limitations / next steps

- JWT is stored in `localStorage` on the frontend — fine for an MVP demo,
  but move to an httpOnly cookie before handling real tax documents.
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
# Tax-Copilot
