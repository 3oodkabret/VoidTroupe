# Deployment Guide

This repo is a PNPM workspace with:

- Frontend: `artifacts/void-troupe` (Vite, deploy to Vercel)
- Backend: `artifacts/api-server` (Express, deploy to Render or Railway)
- Database: PostgreSQL (Supabase or Neon)

---

## 1) Environment Variables

### Backend (Render/Railway)

Set these in your backend service dashboard:

```env
DATABASE_URL=postgresql://<user>:<password>@<host>:<port>/<db>?sslmode=require
PORT=8080
FRONTEND_URL=https://<your-vercel-domain>
GROQ_API_KEY=<your-groq-key>
GROQ_MODEL=llama-3.3-70b-versatile
SESSION_SECRET=<long-random-secret>
LOG_LEVEL=info
```

Notes:

- `FRONTEND_URL` is used by CORS in `api-server`.
- You can allow multiple origins by comma-separating values:
  `FRONTEND_URL=https://app.vercel.app,https://www.yourdomain.com`

### Frontend (Vercel)

Set these in Vercel Project Settings -> Environment Variables:

```env
VITE_API_URL=https://<your-backend-domain>
BASE_PATH=/
```

Notes:

- `VITE_API_URL` is used for frontend API calls at runtime.
- Do **not** add a trailing slash to `VITE_API_URL`.

### Database (Supabase/Neon)

Copy the provider connection string into backend `DATABASE_URL`.

Use the **pooled** production connection string when available.

---

## 2) Build/Start Scripts (already prepared)

### Backend `artifacts/api-server/package.json`

- Build: `pnpm --filter @workspace/api-server run build`
- Start: `pnpm --filter @workspace/api-server run start`

### Frontend `artifacts/void-troupe/package.json`

- Build: `pnpm --filter @workspace/void-troupe run build`
- Start/Preview: `pnpm --filter @workspace/void-troupe run start`

---

## 3) Deploy Backend (Render or Railway)

Use repo root as project root.

- Build Command:
  `pnpm --filter @workspace/api-server run build`
- Start Command:
  `pnpm --filter @workspace/api-server run start`

After deploy, copy the backend URL (example: `https://api-yourapp.onrender.com`).

---

## 4) Deploy Frontend (Vercel)

Use repo root (monorepo) in Vercel.

- Build Command:
  `pnpm --filter @workspace/void-troupe run build`
- Output Directory:
  `artifacts/void-troupe/dist/public`

Set `VITE_API_URL` to your deployed backend URL, then redeploy.

---

## 5) Post-Deploy Checklist

1. Open frontend URL and run a new analysis.
2. Confirm frontend can call:
   - `POST /api/analyze`
   - `POST /api/chat`
3. Confirm backend CORS allows your Vercel domain.
4. Confirm database writes happen in production DB.
5. If using a custom domain, update:
   - `FRONTEND_URL` in backend
   - `VITE_API_URL` in frontend (if backend domain changed)
