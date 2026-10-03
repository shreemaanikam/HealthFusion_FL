# HealthFusion_FL — Production Deployment Guide

> **Status:** HealthFusion_FL is a healthcare AI **research / clinical decision-support prototype**.
> It reports *model-predicted risk*. It is not a diagnostic system, is not clinically validated,
> and makes no regulatory-compliance claims.
>
> For local development and Docker Compose, see [local_development.md](local_development.md).

## Architecture

```
Browser ──HTTPS──▶ Vercel (Next.js frontend)
                       │ HTTPS (NEXT_PUBLIC_API_BASE_URL)
                       ▼
                  Render (FastAPI backend)
                   ├─ TensorFlow model (bundled, 92 KB)
                   ├─ SHAP explainability
                   ├─ Federated learning (SIMULATION)
                   ├─ OpenRouter (optional, server-side)
                   └─ PostgreSQL (Render managed)
```

| Name | Value |
|------|-------|
| `PUBLIC_URL` | `https://<your-project>.vercel.app` (assigned by Vercel on first deploy) |
| `API_URL` | `https://<your-backend>.onrender.com` (assigned by Render on first deploy) |

Users only ever need `PUBLIC_URL`. A custom domain can be attached later in either dashboard; it is not required.

## 1. Deploy the backend (Render)

1. Push the repo to GitHub (`shreemaanikam/HealthFusion_FL`).
2. Render → **New → Blueprint** → select the repo. Render reads [`render.yaml`](../render.yaml) and creates the web service + PostgreSQL database.
3. In the service's **Environment** tab, set the values marked `sync: false`:
   - `JWT_SECRET_KEY` — `python -c "import secrets; print(secrets.token_urlsafe(48))"`
   - `CORS_ORIGINS` — your Vercel URL, e.g. `https://your-project.vercel.app`
   - `OPENROUTER_API_KEY` — optional
4. Deploy. Verify: `curl https://<API_URL>/api/health`.

Python is pinned to 3.12 by [`.python-version`](../.python-version) (TensorFlow 2.16 does not support 3.13+).
`APP_ENV=production` makes the server refuse to start with a placeholder `JWT_SECRET_KEY` and hides `/docs`.

> **Memory:** TensorFlow + SHAP need roughly 1 GB RAM. Render's free tier (512 MB) may be too small and may OOM
> on first prediction. If so, use a paid instance. This is the main practical risk of a free-tier deployment.

> **Cold starts:** free web services sleep after inactivity; the first request can take 30–60 s while TensorFlow loads.

## 2. Deploy the frontend (Vercel)

1. Vercel → **Add New → Project** → import the repo.
2. **Root Directory:** `healthfusion-fl-Frontend`.
3. Environment variables (Production):
   - `NEXT_PUBLIC_DEMO_MODE=false`
   - `NEXT_PUBLIC_API_BASE_URL=https://<API_URL>` (no trailing slash)
4. Deploy, then copy the Vercel URL into the backend's `CORS_ORIGINS` and redeploy the backend.

Only `NEXT_PUBLIC_*` values reach the browser. Never put `JWT_SECRET_KEY`, `DATABASE_URL`, or `OPENROUTER_API_KEY` there.

## 3. Environment variables

Backend (see [`.env.example`](../.env.example)):

| Variable | Production value |
|----------|------------------|
| `APP_ENV` | `production` |
| `DEBUG` | `false` |
| `DEMO_MODE` | `false` |
| `DATABASE_URL` | injected by Render from the managed database |
| `JWT_SECRET_KEY` | strong random secret (dashboard only) |
| `CORS_ORIGINS` | real frontend HTTPS origin(s) only |
| `OPENROUTER_API_KEY` / `OPENROUTER_MODEL` | optional |

Frontend (see [`.env.local.example`](../healthfusion-fl-Frontend/.env.local.example)): `NEXT_PUBLIC_DEMO_MODE`, `NEXT_PUBLIC_API_BASE_URL`.

## 4. Database

- Development: SQLite (`sqlite:///./healthfusion.db`).
- Production: PostgreSQL. `postgres://` / `postgresql://` URLs are converted to `postgresql+asyncpg://` automatically.
- Tables are created idempotently at startup (`init_db`). **Alembic migrations are not set up yet** — schema changes to an existing production database need a manual migration. Known limitation.
- Only application data (users, organizations, audit, model metadata) is stored. No hospital datasets are uploaded.
- Render's free PostgreSQL instance expires after a limited period; back up or upgrade for anything beyond a demo.

## 5. OpenRouter

Optional and server-side only. If `OPENROUTER_API_KEY` is empty or the service is unreachable, insights fall back to deterministic rule-based text; prediction and SHAP are unaffected. Free model names change over time — if requests fail, set `OPENROUTER_MODEL` to a currently available model.

## 6. CORS

`CORS_ORIGINS` is a comma-separated list of exact origins. Production must list only the real frontend. Allowed methods: GET/POST/PUT/PATCH/DELETE/OPTIONS; allowed headers: `Authorization`, `Content-Type`, `Accept`.

## 7. Model deployment

`models/tensorflow/diabetes_nn.keras` is 92 KB and is bundled in git via a `.gitignore` exception. Larger sklearn `.pkl` artifacts remain excluded. If the model grows past ~50 MB, move to Git LFS or object storage.

## 8. Docker (optional, infrastructure only)

```bash
docker build -t healthfusion-backend .
docker run --rm -p 8000:8000 --env-file .env healthfusion-backend
curl http://localhost:8000/api/health
```

The container binds to `$PORT` (default 8000) and runs as a non-root user. End users never need Docker.

## 9. Health checks & monitoring

- `GET /api/health` — liveness + real subsystem checks (model, DB round-trip, OpenRouter key). Returns `degraded` if the model or DB is unavailable.
- `GET /api/system/status` — environment, version, model/DB/federated/OpenRouter status, uptime. No secrets or paths.
- Logs: Render dashboard (backend) and Vercel dashboard (frontend). No paid monitoring is required.

## 10. Rollback

- **Frontend:** Vercel → Deployments → previous deployment → *Promote to Production*.
- **Backend:** Render → Deploys → *Rollback*, or `git revert` and push (autoDeploy is on).
- **Known-good tags:** `v0.1.0-backend`, `v0.2.0-integration`.
- `init_db` is additive only, so code rollbacks are safe unless manual migrations were applied.

## 11. Troubleshooting

| Symptom | Likely cause / fix |
|---------|-------------------|
| Browser console CORS error | `CORS_ORIGINS` doesn't exactly match the Vercel origin (scheme, no trailing slash). |
| Frontend shows "service unavailable" | `NEXT_PUBLIC_API_BASE_URL` wrong/missing, or backend cold-starting. Rebuild the frontend after changing `NEXT_PUBLIC_*`. |
| Backend exits at startup | `JWT_SECRET_KEY` unset in production (intended guard). |
| `/api/health` says `degraded` | Model file missing or DB unreachable — check logs. |
| Out-of-memory / restarts | TensorFlow needs more RAM than the free tier; upgrade the instance. |
| `/docs` returns 404 | Intentional in production. |
