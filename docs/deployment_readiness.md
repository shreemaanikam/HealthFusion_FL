# HealthFusion_FL — Deployment Readiness Audit
**Date:** 2026-10-03 | **Audited against:** v0.2.0-integration (`b1310ff`)

---

## Summary

| Category | Status |
|----------|--------|
| Backend startup | ✅ READY |
| Frontend build | ✅ READY |
| Authentication (JWT) | ✅ READY |
| CORS configuration | ⚠️ NEEDS FIX — `CORS_ORIGINS` default still has localhost only |
| Database (SQLite dev) | ✅ READY |
| Database (PostgreSQL prod) | ⚠️ NEEDS FIX — asyncpg driver not in requirements.txt |
| Model loading (TF .keras) | ⚠️ NEEDS FIX — .keras excluded by .gitignore, cannot deploy via git |
| SHAP explainability | ✅ READY |
| OpenRouter integration | ✅ READY — fallback implemented |
| Health endpoint | ✅ READY |
| Secret handling | ✅ READY — no real secrets in tracked files |
| Docker | ✅ READY — minor fixes needed |
| Python version pinning | ⚠️ NEEDS FIX — .python-version file missing |
| Production error handling | ✅ READY |
| Frontend env config | ✅ READY |
| Render deployment config | ⚠️ NEEDS FIX — render.yaml missing |
| Vercel deployment config | ⚠️ NEEDS FIX — vercel.json missing |
| Alembic migrations | ⚠️ NEEDS FIX — no migration files, uses init_db() only |
| Performance / timeouts | ⚠️ OPTIONAL — SHAP can be slow (~3s); no timeout configured |
| 3D visualization mobile | ✅ READY — 2D fallback implemented |

---

## Detailed Findings

### ✅ READY

| Item | Detail |
|------|--------|
| FastAPI app structure | `backend/app/main.py` — clean, routers registered, CORS middleware present |
| Auth (JWT Bearer) | `POST /api/users/login` returns `{access_token, token_type}`. `GET /api/users/me` validates `Authorization: Bearer` |
| Auth roles | `DOCTOR`, `HOSPITAL_ADMIN`, `RESEARCHER`, `SYSTEM_ADMIN` in `RoleEnum` |
| OpenRouter fallback | `is_configured` check prevents crash; deterministic insight returned |
| Secret storage | `.env` not tracked, `OPENROUTER_API_KEY` loads only from server env |
| Production secrets | No real keys in `.env.example`, `config.py` defaults are `change-me-*` |
| Health endpoint | `GET /api/health` dynamically checks model, DB, OpenRouter |
| Frontend env | `NEXT_PUBLIC_API_BASE_URL` and `NEXT_PUBLIC_DEMO_MODE` are env-var driven |
| No frontend secrets | `OPENROUTER_API_KEY`, `JWT_SECRET_KEY` not in `NEXT_PUBLIC_*` |
| TypeScript | 0 errors (`npm run typecheck`) |
| Frontend tests | 69/69 pass |
| Backend tests | 24/24 pass |
| `DEBUG` mode | `DEBUG: bool = True` default — overridden to `False` in prod env |
| bcrypt | Fixed to use `bcrypt` directly (passlib compat bug resolved) |

### ⚠️ NEEDS FIX

| Item | Fix Required |
|------|-------------|
| `.python-version` | Create with `3.12` for Render/Railway compatibility |
| `.keras` in `.gitignore` | The 92 KB model must be deployable; add exception for the specific TF model |
| PostgreSQL driver | `asyncpg` not in `requirements.txt`; needed for production DB |
| `render.yaml` | Render deployment spec file missing |
| `vercel.json` | Vercel config for Next.js missing |
| `CORS_ORIGINS` default | `config.py` default includes only `localhost:3000` and `localhost:5173` |
| Alembic migrations | No migration files — `init_db()` is fine for SQLite but not for PostgreSQL schema versioning |
| `APP_ENV` production | Must set `APP_ENV=production` and `DEMO_MODE=false` in prod env |
| `DATABASE_URL` for PostgreSQL | Must use `postgresql+asyncpg://...` format for async SQLAlchemy |
| Frontend `.env.example` | Missing `NEXT_PUBLIC_API_BASE_URL` placeholder for Vercel |
| Model preprocessors dir | `models/preprocessors/` missing — prediction falls back to no-scaler mode |

### 📋 OPTIONAL

| Item | Detail |
|------|--------|
| Alembic migrations | Implement for long-term schema evolution |
| SHAP timeout | Add async timeout (10s) to prevent slow SHAP blocking |
| PostgreSQL connection pool | Set `pool_size` and `max_overflow` for production load |
| Redis cache | Optional: cache SHAP global importance (currently pre-computed constant) |
| Custom domain | Not required; default `*.vercel.app` and `*.onrender.com` work |
| Monitoring | Render/Vercel provide basic logs; no paid APM needed for prototype |
| Rate limiting | Optional for public API (`slowapi` package) |

### 🚫 BLOCKED

None — all critical items have known fixes.

---

## Deployment Architecture Decision

| Layer | Choice | Reason |
|-------|--------|--------|
| Frontend | **Vercel** | Native Next.js support, free tier, zero config |
| Backend | **Render** | Native Python/FastAPI support, free web service + PostgreSQL |
| Database | **Render PostgreSQL** | Free tier, same platform as backend |
| Model | **Git bundle** | 92 KB .keras file — tiny, safe to track via `.gitignore` exception |
| LLM | **OpenRouter** | Already integrated; key from Render env var |

---

## Model Deployment Decision

The TensorFlow model (`diabetes_nn.keras`) is **92 KB** — smaller than most PNG images.

**Decision: Bundle in git repository via `.gitignore` exception.**

```
# .gitignore exception
!models/tensorflow/diabetes_nn.keras
!models/preprocessors/scaler.joblib  # if present
```

This is the simplest, most reliable approach for a prototype:
- No S3/object-storage dependency
- No download step at startup
- No startup latency from model fetching
- Model version is tied to code commit (reproducible)

If the model grows beyond 50 MB in future, switch to Git LFS or model registry.
