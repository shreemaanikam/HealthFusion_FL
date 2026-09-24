# HealthFusion_FL

## Explainable Adaptive Federated Healthcare Intelligence Framework

[![Python 3.12](https://img.shields.io/badge/Python-3.12-blue.svg)](https://python.org)
[![TensorFlow](https://img.shields.io/badge/TensorFlow-2.16+-orange.svg)](https://tensorflow.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111+-green.svg)](https://fastapi.tiangolo.com)
[![Flower](https://img.shields.io/badge/Flower-1.11+-purple.svg)](https://flower.ai)

---

## Overview

HealthFusion_FL is a privacy-preserving federated learning framework for healthcare risk prediction. It combines:

- **Deep Learning** — TensorFlow/Keras neural network for diabetes risk prediction
- **Federated Learning** — Flower-based distributed training across simulated hospital nodes
- **Explainable AI** — SHAP-based feature explanations for model transparency
- **Adaptive Aggregation** — Performance-weighted federated aggregation strategy
- **Privacy Mechanisms** — Differential privacy and data locality enforcement
- **Clinical Insights** — Structured risk assessments with optional LLM enhancement

> **Disclaimer:** This is a research prototype. Predictions are model-predicted risk assessments, NOT medical diagnoses.

---

## Architecture

```
                    HealthFusion_FL
                          │
          ┌───────────────┼────────────────┐
          │               │                │
     Prediction       Explainability    AI Insight
      Service           Service          Service
          │               │                │
     TensorFlow         SHAP          OpenRouter
          │                              (optional)
          ▼
   Federated Learning (Flower)
          │
          ▼
  Adaptive Aggregation
          │
          ▼
    Global Model
          │
          ▼
  Privacy + Audit + Governance
          │
          ▼
     FastAPI Backend ──── SQLite/PostgreSQL
```

---

## Quick Start

### Prerequisites

- Python 3.12
- Git

### Setup

```bash
# Clone the repository
git clone <repository-url>
cd HealthFusion_FL

# Create virtual environment
python3.12 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment template
cp .env.example .env
# Edit .env with your settings

# Initialize the database
python -c "from backend.app.core.database import init_db; import asyncio; asyncio.run(init_db())"

# Start the backend
uvicorn backend.app.main:app --reload --port 8000
```

### Docker

```bash
docker-compose up --build
```

---

## Project Structure

```
HealthFusion_FL/
├── src/
│   ├── ml/                    # ML pipeline (TF model, training, evaluation)
│   ├── federated/             # Flower FL (server, client, partitioning)
│   │   ├── partitioning/      # IID and non-IID data strategies
│   │   └── adaptive_aggregation/  # Performance-weighted aggregation
│   ├── explainability/        # SHAP explanations
│   ├── privacy/               # Differential privacy, data locality
│   └── monitoring/            # Drift detection, model monitoring
├── backend/
│   └── app/                   # FastAPI application
│       ├── api/routes/        # API endpoints
│       ├── services/          # Business logic
│       ├── schemas/           # Pydantic models
│       ├── models/            # SQLAlchemy ORM
│       └── core/              # Security, database, logging
├── data/
│   ├── raw/                   # Original dataset
│   ├── processed/             # Preprocessed train/test
│   └── federated/             # Client partitions
├── models/                    # Saved model artifacts
├── reports/                   # Evaluation results
├── tests/                     # Unit, integration, e2e tests
└── docs/                      # Documentation
```

---

## Dataset

**Diabetes Prediction Dataset** — 100,000 records, 9 columns.

| Feature | Type |
|---------|------|
| gender | categorical |
| age | numerical |
| hypertension | binary |
| heart_disease | binary |
| smoking_history | categorical |
| bmi | numerical |
| HbA1c_level | numerical |
| blood_glucose_level | numerical |
| **diabetes** (target) | **binary** |

---

## Baseline Results

| Model | Accuracy | Precision | Recall | F1 |
|-------|----------|-----------|--------|-----|
| Logistic Regression | 95.95% | 86.84% | 63.80% | 73.56% |
| Decision Tree | 94.83% | 69.31% | 74.29% | 71.71% |
| Random Forest (baseline) | 96.95% | 94.90% | 69.10% | 79.97% |
| Federated RF (majority vote) | 97.14% | 98.81% | 68.40% | 80.84% |

---

## API Documentation

Once the server is running, access the interactive API docs:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Key Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/system/status` | System status |
| POST | `/api/prediction` | Risk prediction |
| POST | `/api/explainability` | SHAP explanation |
| GET | `/api/federated/status` | FL status |
| GET | `/api/models` | Model registry |
| GET | `/api/privacy/status` | Privacy status |
| POST | `/api/insights/generate` | Clinical insight |

See [docs/frontend_api_contract.md](docs/frontend_api_contract.md) for the full API contract.

---

## Documentation

Comprehensive technical documentation is available in the [`docs/`](docs/) directory:

| Document | Description |
| :--- | :--- |
| [Architecture](docs/architecture.md) | High-level system architecture and component topology |
| [Machine Learning Pipeline](docs/ml_pipeline.md) | Ingestion, preprocessing, baseline models, neural network, evaluation & fairness |
| [Federated Learning](docs/federated_learning.md) | Flower setup, 3 hospital clients, IID/Non-IID partitioning, orchestration |
| [Explainability (SHAP)](docs/explainability.md) | Local & global SHAP attributions, KernelExplainer & TreeExplainer, JSON schema |
| [Adaptive Aggregation](docs/adaptive_aggregation.md) | AdaptiveFedAvg weighting formula (40/30/20/10), comparison with FedAvg |
| [Privacy Architecture](docs/privacy.md) | Data locality (ACTIVE), Differential Privacy (SIMULATION), SecAgg (PLANNED), Audit |
| [Security & Access Control](docs/security.md) | JWT auth, RBAC roles (DOCTOR, HOSPITAL_ADMIN, RESEARCHER, SYSTEM_ADMIN), CORS, headers |
| [Deployment & Operations](docs/deployment.md) | Docker, docker-compose, free-tier deployment (Render/Railway, Supabase, Vercel) |
| [Research & Experiments](docs/research_experiments.md) | 6-way paradigm comparison, Non-IID and DP ablations, reproducibility guarantees |
| [Frontend API Contract](docs/frontend_api_contract.md) | Detailed REST API schema, requests, responses, and examples |

---

## Running ML Pipeline

```bash
# Train TensorFlow model
python -m src.ml.train_tensorflow

# Evaluate model
python -m src.ml.evaluate_tensorflow

# Run federated learning simulation
python -m src.federated.runner
```

---

## Testing

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=src --cov=backend

# Run specific test suite
pytest tests/unit/
pytest tests/integration/
```

---

## Environment Variables

See [.env.example](.env.example) for all configuration options.

Key variables:
- `DEMO_MODE` — Enable demo mode with synthetic data
- `FEDERATION_MODE` — `iid` or `non_iid`
- `DP_ENABLED` — Enable differential privacy
- `OPENROUTER_API_KEY` — Optional LLM explanation layer

---

## Feature Status

> **Transparency note:** Not all capabilities are fully production-ready.
> The table below shows the honest status of each feature.

| Feature | Status | Notes |
|---------|--------|-------|
| TensorFlow risk prediction | **ACTIVE** | Centralized NN trained and serving predictions |
| SHAP explainability | **ACTIVE** | Local + global feature explanations |
| FastAPI backend | **ACTIVE** | All API endpoints operational |
| JWT authentication | **ACTIVE** | Role-based access control enforced |
| Multi-tenancy | **ACTIVE** | Organization-scoped users and audit |
| Audit logging | **ACTIVE** | All events tracked to database |
| Data locality | **ACTIVE** | Raw data stays on simulated clients |
| Federated learning (Flower) | **SIMULATION** | In-process simulation, not cross-network |
| Adaptive aggregation | **SIMULATION** | Implemented, tested in simulation only |
| Differential privacy | **SIMULATION** | Noise mechanism built, not yet applied to training |
| OpenRouter AI explanation | **ACTIVE** | When `OPENROUTER_API_KEY` is configured; fallback otherwise |
| Secure aggregation | **PLANNED** | Architecture defined, not yet implemented |

---

## Dataset

The full dataset (100K records) is **not included** in this repository.
A 100-row sample is provided at `data/raw/sample_data.csv` for testing.

See [docs/data_setup.md](docs/data_setup.md) for download instructions.

---

## Security

- All secrets in `.env` (never committed)
- JWT-based authentication
- Role-based authorization (DOCTOR, HOSPITAL_ADMIN, RESEARCHER, SYSTEM_ADMIN)
- Input validation on all endpoints
- No patient data in logs
- CORS configured for frontend origin

---

## License

This project is for academic/research purposes.

---

## Authors

HealthFusion_FL Research Team
