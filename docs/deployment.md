# HealthFusion_FL — Deployment & Operations Guide

This guide details deployment options for HealthFusion_FL, covering local development, containerized execution via Docker and Docker Compose, and zero-cost cloud deployment using free-tier services.

---

## 1. Local Development Run

### 1.1 Prerequisites
- Python 3.12+
- Virtual environment (`venv` or `conda`)
- SQLite (built into Python) or PostgreSQL 15+

### 1.2 Setup Instructions

1. **Clone and Navigate**:
   ```bash
   git clone https://github.com/shreemaanikam/HealthFusion_FL.git
   cd HealthFusion_FL
   ```

2. **Initialize Virtual Environment**:
   ```bash
   python3.12 -m venv .venv
   source .venv/bin/activate
   ```

3. **Install Dependencies**:
   ```bash
   pip install --upgrade pip
   pip install -r requirements.txt
   ```

4. **Configure Environment Variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your local secrets
   ```

5. **Start Application**:
   ```bash
   # Method 1: Using the unified main launcher
   python main.py

   # Method 2: Direct Uvicorn invocation
   cd backend && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

6. **Verify Health**:
   Open [http://localhost:8000/docs](http://localhost:8000/docs) in your browser, or run:
   ```bash
   curl -s http://localhost:8000/api/health | jq .
   ```

---

## 2. Docker & Containerized Deployment

HealthFusion_FL includes production-grade container manifests: [`Dockerfile`](file:///Users/shreemaanikam/HealthFusion_FL/Dockerfile) and [`docker-compose.yml`](file:///Users/shreemaanikam/HealthFusion_FL/docker-compose.yml).

### 2.1 Dockerfile Architecture
- **Base Image**: `python:3.12-slim` (minimal vulnerability surface).
- **System Dependencies**: Installs `gcc` for C-extension builds and clears apt caches.
- **Persistent Directories**: Pre-provisions directories for `models/`, `data/`, `reports/`, and `logs/`.
- **Healthcheck Probe**: Periodically checks `http://localhost:8000/api/health` via `httpx`.

```dockerfile
FROM python:3.12-slim
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends gcc && rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
RUN mkdir -p models/tensorflow models/preprocessors models/baseline data/processed data/federated reports logs
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD python -c "import httpx; r = httpx.get('http://localhost:8000/api/health'); r.raise_for_status()" || exit 1
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--app-dir", "backend"]
```

### 2.2 Docker Compose Execution

```bash
# Build and run containerized backend
docker-compose up --build

# Run in background (detached mode)
docker-compose up -d

# View container logs
docker-compose logs -f backend

# Stop container services
docker-compose down
```

---

## 3. Free-Tier Cloud Deployment Guide

HealthFusion_FL is designed to run seamlessly on popular free-tier cloud platforms.

```mermaid
graph TD
    User["Clinician / Web Browser"] --> Frontend["Future Web Frontend\n(Deployed on Vercel / Netlify)"]
    Frontend --> Backend["HealthFusion_FL FastAPI\n(Deployed on Render or Railway Web Service)"]
    Backend --> DB["PostgreSQL Database\n(Hosted on Supabase Free Tier)"]
    Backend --> ML["Local In-Memory Inference\n(TensorFlow + SHAP + Preprocessors)"]
```

### 3.1 Backend: Render or Railway
- **Platform**: Render ([render.com](https://render.com)) or Railway ([railway.app](https://railway.app)).
- **Instance Type**: Free / Hobby Tier.
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**:
  ```bash
  uvicorn app.main:app --host 0.0.0.0 --port $PORT --app-dir backend
  ```
- **Root Directory**: Project root (`/`).

### 3.2 Database: Supabase (PostgreSQL)
- **Platform**: Supabase ([supabase.com](https://supabase.com)) Free Tier (includes 500MB storage and pooling).
- **Setup**: Create a new project, copy the connection string:
  ```text
  postgresql+asyncpg://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
  ```
- Set `DATABASE_URL` in your backend environment variables to this string.

### 3.3 Frontend: Vercel or Netlify
- For future React/Next.js client portals, deploy to Vercel with zero server management.
- Configure `NEXT_PUBLIC_API_URL` to point to the Render/Railway backend domain.

---

## 4. Environment Variables Checklist

Ensure the following variables are configured before deploying to production:

| Variable | Required | Example / Recommended Setting | Description |
| :--- | :---: | :--- | :--- |
| `APP_NAME` | Yes | `HealthFusion_FL` | Application brand identifier |
| `APP_ENV` | Yes | `production` (`development` for local) | Runtime environment state |
| `DEBUG` | Yes | `false` (Never `true` in prod) | Disables detailed stack trace leakage |
| `SECRET_KEY` | Yes | `a9f3...` (64-char random hex string) | Cryptographic signature key |
| `DATABASE_URL` | Yes | `postgresql+asyncpg://user:pass@host:5432/db` | Async SQLAlchemy database URI |
| `JWT_SECRET_KEY` | Yes | `7b2e...` (64-char random hex string) | Secret key for JWT signing |
| `JWT_ALGORITHM` | Yes | `HS256` | JWT signature algorithm |
| `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` | Yes | `60` | Token expiration duration |
| `CORS_ORIGINS` | Yes | `https://healthfusion.vercel.app` | Comma-separated whitelist of allowed frontends |
| `FEDERATION_MODE` | No | `iid` or `non_iid` | Simulation federation profile |
| `FL_NUM_ROUNDS` | No | `5` | Number of federated training rounds |
| `FL_MIN_CLIENTS` | No | `3` | Minimum client quorum |
| `DP_ENABLED` | No | `false` | Enable differential privacy noise injection |
| `DP_EPSILON` | No | `1.0` | Target privacy budget |
| `BACKEND_HOST` | Yes | `0.0.0.0` | Network binding interface |
| `BACKEND_PORT` | Yes | `8000` | Network listening port |
| `LOG_LEVEL` | No | `INFO` | Logging verbosity (`DEBUG`, `INFO`, `WARNING`) |

---

## 5. Operations & Healthcheck

The deployment includes an automated healthcheck probe accessible without authentication:

### Request
```bash
curl -X GET "http://localhost:8000/api/health"
```

### Response
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "environment": "production",
  "services": {
    "database": "connected",
    "model_service": "loaded",
    "federated_engine": "ready"
  },
  "timestamp": "2026-09-25T00:00:00.000000"
}
```
