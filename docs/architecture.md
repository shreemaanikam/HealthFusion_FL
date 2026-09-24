# HealthFusion_FL — Architecture Documentation

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

## Module Overview

### 1. ML Pipeline (`src/ml/`)
- **preprocessing.py**: Data cleaning, encoding, scaling with saved artifacts
- **tensorflow_model.py**: Neural network architecture (64→32→16→1)
- **train_tensorflow.py**: Training with class weights, early stopping
- **evaluate_tensorflow.py**: Comprehensive evaluation (ROC-AUC, PR-AUC, calibration, fairness)
- **model_registry.py**: Version tracking and model lifecycle management

### 2. Federated Learning (`src/federated/`)
- **server.py**: Flower FL server with FedAvg strategy
- **client.py**: Flower client wrapping TF model training
- **strategy.py**: AdaptiveFedAvg with performance-weighted aggregation
- **runner.py**: Simulation orchestrator
- **partitioning/**: IID and non-IID data distribution strategies
- **adaptive_aggregation/**: Client weighting and weighted parameter averaging

### 3. Explainability (`src/explainability/`)
- **shap_explainer.py**: SHAP integration (KernelExplainer for NN, TreeExplainer for RF)
- **feature_importance.py**: Global feature importance computation
- **explanation_formatter.py**: Structured JSON output formatting

### 4. Privacy (`src/privacy/`)
- **differential_privacy.py**: Gaussian DP mechanism with gradient clipping
- **data_locality.py**: Enforcement that raw data stays on clients
- **privacy_monitor.py**: Cumulative privacy budget tracking

### 5. Monitoring (`src/monitoring/`)
- **drift_detector.py**: KS-test based feature and prediction drift detection
- **model_monitor.py**: Prediction distribution tracking

### 6. Backend API (`backend/app/`)
- **FastAPI** with 10 route groups
- **SQLAlchemy** async ORM
- **JWT** authentication with role-based access
- **Pydantic** typed request/response models

## Data Flow

```
Raw CSV (100K records)
    │
    ▼
Preprocessing (dedup, encode, scale)
    │
    ▼
Train/Test Split (80/20 stratified)
    │
    ├──→ Centralized Training (baseline)
    │        └── RF, DT, LR models
    │
    └──→ Federated Partitioning
             │
             ├── IID: equal stratified splits
             └── Non-IID: label/quantity/feature skew
                  │
                  ▼
             Local NN Training (per client)
                  │
                  ▼
             Aggregation (FedAvg / AdaptiveFedAvg)
                  │
                  ▼
             Global Model
                  │
                  ▼
             Evaluation + SHAP
```

## Technology Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| ML Framework | TensorFlow/Keras | 2.16+ |
| Federated Learning | Flower (flwr) | 1.11+ |
| Explainability | SHAP | 0.45+ |
| Backend | FastAPI | 0.111+ |
| Database | SQLAlchemy + SQLite/PostgreSQL | 2.0+ |
| Auth | JWT (python-jose) | 3.3+ |
| HTTP Client | httpx | 0.27+ |
| Testing | pytest | 8.0+ |
| Container | Docker | - |
| Python | 3.12 | - |
