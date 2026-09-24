# HealthFusion_FL

## Explainable Adaptive Federated Healthcare Intelligence Framework

[![Python 3.12](https://img.shields.io/badge/Python-3.12-blue.svg)](https://python.org)
[![TensorFlow](https://img.shields.io/badge/TensorFlow-2.16+-orange.svg)](https://tensorflow.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111+-green.svg)](https://fastapi.tiangolo.com)
[![Flower](https://img.shields.io/badge/Flower-1.23+-purple.svg)](https://flower.ai)
[![License](https://img.shields.io/badge/License-Academic%20Research-lightgrey.svg)](LICENSE)

---

## Overview

**HealthFusion_FL** is a privacy-preserving, federated intelligence framework engineered for clinical risk prediction. It addresses critical healthcare informatics challenges: multi-institutional data silos, data heterogeneity across clinical centers, class imbalance, and model interpretability.

The framework unites:
- **Centralized & Federated Deep Learning**: TensorFlow/Keras neural networks with class-weight handling and Flower-based distributed training.
- **Explainable AI (XAI)**: SHAP (SHapley Additive exPlanations) providing verifiable, zero-hallucination feature attributions.
- **Adaptive Aggregation**: An objective multi-factor weighting strategy (`AdaptiveFedAvg`) that counteracts client drift and institutional data imbalance.
- **Privacy & Governance**: Strict data locality guarantees, differential privacy mechanisms, and tamper-evident audit trails.
- **Clinical Decision Support**: Deterministic rule-based insights augmented by an optional OpenRouter LLM plain-language explanation layer.

> **Clinical Disclaimer:** HealthFusion_FL is an academic research and clinical decision support prototype. All outputs represent **model-predicted risk assessments**, **NOT** definitive medical diagnoses.

---

## System Architecture

```
                        HealthFusion_FL
                              │
            ┌─────────────────┼──────────────────┐
            │                 │                  │
       Prediction        Explainability      AI Insight
        Service             Service            Service
            │                 │                  │
       TensorFlow           SHAP            OpenRouter
       /Keras NN                             (optional)
            │
            ▼
    Federated Learning
    (Flower Framework)
            │
     ┌──────┼──────┐
     │      │      │
   Hosp A  Hosp B  Hosp C
   (client) (client) (client)
     │      │      │
     └──────┼──────┘
            │
   Adaptive Aggregation
   (Performance-weighted)
            │
            ▼
       Global Model
            │
            ▼
  Privacy + Audit + Governance
  (DP, Data Locality, Audit Log)
            │
            ▼
       FastAPI Backend
            │
       ┌────┼────┐
       │         │
    SQLite    PostgreSQL
    (dev)      (prod)
```

---

## Current Capabilities

### 1. Deep Learning Risk Prediction
- **Architecture**: Feedforward Neural Network with Batch Normalization and Dropout regularization (`Input(8) → Dense(64, ReLU) → BN → Dropout(0.3) → Dense(32, ReLU) → BN → Dropout(0.2) → Dense(16, ReLU) → Dense(1, Sigmoid)`).
- **Optimization**: Adam optimizer, binary cross-entropy loss, class weighting for severe class imbalance (~91.5% non-diabetic vs ~8.5% diabetic), EarlyStopping on validation AUC.
- **Empirical Centralized Performance**: **87.51% Accuracy**, **0.9776 ROC-AUC**, **0.865 PR-AUC** on held-out test data.

### 2. Explainable AI (SHAP)
- **Local Explanations**: Sample-level SHAP values ($\phi_i$) quantifying exact positive and negative feature contributions toward individual predictions.
- **Global Explanations**: Population-level mean absolute SHAP importance ranks (`HbA1c_level` > `blood_glucose_level` > `bmi` > `age`).
- **Explainers**: `KernelExplainer` (with k-means/sampled background baselines) for neural networks and `TreeExplainer` for ensemble baselines.
- **Zero-Hallucination Design**: Attributions are mathematically grounded in cooperative game theory, never fabricated.

### 3. Federated Learning & Client Simulation
- **Framework**: Flower (`flwr`) in-process simulation engine supporting multi-client federated training without requiring distributed network orchestration.
- **Hospital Nodes**: Configured for 3 clinical centers (`Hospital_A`, `Hospital_B`, `Hospital_C`).
- **Data Partitioning**:
  - *IID Uniform*: Equal size and balanced label distributions across all clients.
  - *Non-IID Label Skew*: Dirichlet distribution modeling disease prevalence disparity (e.g. specialized diabetic clinics vs general care).
  - *Non-IID Quantity Skew*: Hospital volume variations (50% / 30% / 20%).
  - *Non-IID Feature Skew*: Demographic distribution skew by patient age cohorts.

### 4. Adaptive Aggregation (`AdaptiveFedAvg`)
- Standard FedAvg weights clients solely by sample volume ($w_k = n_k / N$), making it vulnerable to low-quality data and non-IID drift.
- `AdaptiveFedAvg` dynamically computes institutional weights based on:
  $$\tilde{w}_k = 0.40 \cdot \mathcal{P}_k + 0.30 \cdot \mathcal{S}_k + 0.20 \cdot \mathcal{V}_k + 0.10 \cdot \mathcal{R}_k$$
  Where $\mathcal{P}_k$ is validation performance, $\mathcal{S}_k$ is sample volume, $\mathcal{V}_k$ is gradient stability, and $\mathcal{R}_k$ is historical reliability.
- Bounded to $[0.10, 0.60]$ and normalized to $\sum w_k = 1.0$ to prevent institutional dominance.

### 5. Privacy & Data Governance
- **Data Locality (ACTIVE)**: Raw clinical data remains strictly on client nodes. Zero patient records leave the local node; only model parameter updates ($\Delta W$) are transmitted.
- **Differential Privacy (SIMULATION)**: Gaussian noise mechanism with bounded gradient clipping ($\Delta S$) calibrated to $(\epsilon, \delta)$ privacy budgets:
  $$\sigma = \frac{\Delta S \cdot \sqrt{2 \ln(1.25/\delta)}}{\epsilon}$$
- **Audit Logging (ACTIVE)**: Immutable event logging capturing timestamped user actions, model predictions, and federated rounds with tenant organization scoping.

### 6. Clinical Decision Support & AI Insights
- **Deterministic Insight Engine**: Rule-based clinical triage mapping blood glucose, HbA1c, and comorbidities to clinical screening recommendations.
- **OpenRouter LLM Integration**: Plain-language, patient-oriented explanation summaries using conversational models (e.g. `qwen/qwen3.8-27b:free`).
- **Defensive Safeguards**: Strict system prompts enforcing non-diagnostic terminology, zero PHI transmission, and automatic fallback to structured deterministic insights if external APIs are unreachable or throttled.

### 7. Enterprise Backend Architecture
- **FastAPI Async Core**: High-throughput asynchronous endpoints with Pydantic v2 input validation.
- **Relational Storage**: Async SQLAlchemy supporting SQLite (local development) and PostgreSQL (production).
- **Authentication & RBAC**: Stateless JWT authentication enforcing 4 clinical roles: `DOCTOR`, `HOSPITAL_ADMIN`, `RESEARCHER`, and `SYSTEM_ADMIN`.

---

## Feature Status: Active vs. Simulation

> **Transparency Note:** In compliance with ethical healthcare software practices, HealthFusion_FL maintains rigorous honesty regarding module operational readiness.

| Feature / Subsystem | Operational Status | Current Implementation Details |
| :--- | :---: | :--- |
| **TensorFlow Risk Prediction** | **ACTIVE** | Centralized neural network trained, saved, and serving predictions via REST API |
| **SHAP Explainability** | **ACTIVE** | Real-time computation of local and global feature importance |
| **FastAPI Backend Core** | **ACTIVE** | 10 modular route controllers operational with async request handling |
| **JWT Authentication & RBAC** | **ACTIVE** | Role-based permission guards active across clinical endpoints |
| **Multi-Tenancy** | **ACTIVE** | Organization and user partitioning with isolated scopes |
| **Audit Logging** | **ACTIVE** | Async database event tracking for authentication, predictions, and admin actions |
| **Data Locality Enforcement** | **ACTIVE** | Training pipelines enforce parameter-only exchange; raw data ingestion is localized |
| **Federated Learning (Flower)** | **SIMULATION** | Multi-hospital in-process simulation (`flwr.simulation`); non-networked local processes |
| **Adaptive Aggregation** | **SIMULATION** | `AdaptiveFedAvg` strategy tested in simulation; not deployed across remote hospital networks |
| **Differential Privacy** | **SIMULATION** | Noise generation and clipping formulas implemented and validated; simulated gradient perturbance |
| **OpenRouter AI Explanation** | **ACTIVE** | Operational when `OPENROUTER_API_KEY` is provided; transparent fallback when unavailable |
| **Secure Aggregation** | **PLANNED** | Cryptographic multi-party computation / secret sharing architecture documented for future release |

---

## Local Setup

### Prerequisites
- **Python**: Version **3.12** (TensorFlow 2.16+ is not compatible with Python 3.14+)
- **Git**
- **Operating System**: macOS, Linux, or Windows (WSL recommended)

### Step-by-Step Installation

```bash
# 1. Clone the repository
git clone https://github.com/shreemaanikam/HealthFusion_FL.git
cd HealthFusion_FL

# 2. Create and activate a Python 3.12 virtual environment
python3.12 -m venv .venv
source .venv/bin/activate       # On Windows: .venv\Scripts\activate

# 3. Upgrade pip and install all project dependencies
pip install --upgrade pip
pip install -r requirements.txt

# 4. Configure environment variables
cp .env.example .env
# Edit .env to set your SECRET_KEY, JWT_SECRET_KEY, and optional OPENROUTER_API_KEY
```

### Running the Backend Server

```bash
# Option A: Start using the main runner (recommended)
python main.py

# Option B: Run uvicorn directly
uvicorn app.main:app --app-dir backend --host 0.0.0.0 --port 8000 --reload
```

The server boots at `http://localhost:8000`.

### Executing the ML & Federated Learning Pipelines

```bash
# Centralized data preprocessing
python -m src.ml.preprocessing

# Train the centralized TensorFlow neural network
python -m src.ml.train_tensorflow

# Evaluate model metrics, calibration, and fairness
python -m src.ml.evaluate_tensorflow

# Run the 3-hospital Federated Learning simulation (IID or Non-IID)
python -m src.federated.runner
```

### Running the Test Suite

```bash
# Run all unit and integration tests (24 tests)
pytest

# Run tests with coverage analysis
pytest --cov=src --cov=backend

# Run specific test suites
pytest tests/unit/
pytest tests/integration/
```

### Docker Deployment

```bash
# Build and run backend container
docker-compose up --build

# Run in detached daemon mode
docker-compose up -d
```

---

## API Documentation Location

When the backend server is running, interactive and machine-readable documentation is accessible at:

| Documentation Interface | URL | Description |
| :--- | :--- | :--- |
| **Interactive Swagger UI** | [http://localhost:8000/docs](http://localhost:8000/docs) | OpenAPI interactive explorer to test live requests |
| **ReDoc UI** | [http://localhost:8000/redoc](http://localhost:8000/redoc) | Clean, searchable reference documentation |
| **OpenAPI Schema (JSON)** | [http://localhost:8000/openapi.json](http://localhost:8000/openapi.json) | Raw OpenAPI 3.1 specification |
| **Frontend Integration Contract** | [`docs/frontend_api_contract.md`](docs/frontend_api_contract.md) | Exhaustive integration contract with request/response schemas, auth flows, and error contracts |

### Key API Endpoints Overview

| Method | Endpoint | Access Level | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Public | Liveness probe and subsystem status |
| `POST` | `/api/users/register` | Public | Register new clinician or researcher |
| `POST` | `/api/users/login` | Public | Authenticate and obtain JWT token |
| `GET` | `/api/users/me` | Authenticated | Retrieve current user profile |
| `POST` | `/api/prediction` | `DOCTOR`+ | Submit 8 clinical features to receive model risk assessment |
| `POST` | `/api/explainability` | `DOCTOR`+ | Compute local SHAP attributions for prediction |
| `POST` | `/api/insights/generate` | `DOCTOR`+ | Generate clinical triage insights & plain-language summary |
| `GET` | `/api/federated/status` | `RESEARCHER`+ | Query current federated round, strategy, and participants |
| `POST` | `/api/federated/train` | `SYSTEM_ADMIN` | Trigger federated aggregation cycle |
| `GET` | `/api/privacy/status` | `SYSTEM_ADMIN` | Audit privacy engine status and cumulative $\epsilon$ budget |
| `GET` | `/api/audit/logs` | `HOSPITAL_ADMIN`+ | Query tenant-scoped audit trails |

---

## Project Structure

```
HealthFusion_FL/
├── src/
│   ├── ml/                    # ML pipeline (TF model, preprocessing, training, evaluation)
│   ├── federated/             # Flower FL (server, client, strategy, runner)
│   │   ├── partitioning/      # IID and non-IID data distribution strategies
│   │   └── adaptive_aggregation/  # Performance-weighted AdaptiveFedAvg
│   ├── explainability/        # SHAP explainers (local and global)
│   ├── privacy/               # Differential privacy, data locality monitor
│   └── monitoring/            # Data and prediction drift detection
├── backend/
│   └── app/                   # FastAPI application
│       ├── api/routes/        # 10 modular route controllers
│       ├── services/          # Business logic services
│       ├── schemas/           # Pydantic v2 schemas
│       ├── models/            # SQLAlchemy database models
│       └── core/              # Security, database connection, structured logging
├── data/
│   ├── raw/                   # Sample data (sample_data.csv) & Kaggle download directory
│   ├── processed/             # Preprocessed train/test partitions
│   └── federated/             # Local client partitions (Hospital A/B/C)
├── docs/                      # 10 comprehensive technical specifications
│   ├── architecture.md        # System topology and data flow
│   ├── frontend_api_contract.md # Frontend consumption contract
│   ├── ml_pipeline.md         # Ingestion, architecture, evaluation
│   ├── federated_learning.md  # Distributed learning design
│   ├── explainability.md      # SHAP integration and math
│   ├── adaptive_aggregation.md# Multi-factor weighting formula
│   ├── privacy.md             # Data locality & DP mechanics
│   ├── security.md            # Auth, RBAC, headers, secrets
│   ├── deployment.md          # Cloud & container setup
│   └── data_setup.md          # Dataset acquisition instructions
├── models/                    # Model artifact directories
├── reports/                   # Performance records & experiment comparisons
├── tests/                     # 24 unit & integration tests
├── .env.example               # Environment variable blueprint
├── .gitignore                 # Exclusion rules protecting secrets and binaries
├── Dockerfile                 # Multi-stage production container
├── docker-compose.yml         # Container orchestration
├── main.py                    # Server launch script
├── pytest.ini                 # Test runner configuration
└── requirements.txt           # Pinned dependency requirements
```

---

## Technical Documentation Suite

For comprehensive deep dives into specific submodules, consult the [`docs/`](docs/) directory:

- [System Architecture](docs/architecture.md)
- [Frontend API Contract](docs/frontend_api_contract.md)
- [Machine Learning Pipeline](docs/ml_pipeline.md)
- [Federated Learning Specification](docs/federated_learning.md)
- [Explainability & SHAP](docs/explainability.md)
- [Adaptive Aggregation Formulation](docs/adaptive_aggregation.md)
- [Privacy Architecture](docs/privacy.md)
- [Security & Access Control](docs/security.md)
- [Deployment & Free-Tier Hosting](docs/deployment.md)
- [Dataset Setup & Kaggle Guide](docs/data_setup.md)
- [Research Experiments Protocol](docs/research_experiments.md)

---

## Dataset & Licensing

- **Dataset**: [Diabetes Prediction Dataset (Kaggle)](https://www.kaggle.com/datasets/iammustafatz/diabetes-prediction-dataset) — 100,000 anonymized clinical records.
- **License**: Public Domain (CC0).
- **Repository Policy**: Raw full-size datasets and trained binary artifacts are excluded to keep the repository lightweight and adhere to reproducible data governance. Download instructions are provided in [`docs/data_setup.md`](docs/data_setup.md). A 100-row stratified sample is included at `data/raw/sample_data.csv` for immediate testing.

---

## Authors & Acknowledgments

HealthFusion_FL Research & Development Team. Built for secure, explainable, and decentralized healthcare intelligence.
