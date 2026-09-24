# HealthFusion_FL — Frontend API Contract

**Version:** 1.0.0
**Base URL:** `http://localhost:8000/api`
**Auth:** JWT Bearer token (except health/status endpoints)
**Content-Type:** `application/json`

---

## Authentication

### POST /users/register
Create a new user account.

**Request:**
```json
{
  "email": "doctor@hospital-a.org",
  "password": "your-password-here",
  "full_name": "Dr. Smith",
  "role": "DOCTOR",
  "organization_id": "org-uuid-here"
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "email": "doctor@hospital-a.org",
  "full_name": "Dr. Smith",
  "role": "DOCTOR",
  "organization_id": "org-uuid-here",
  "is_active": true,
  "created_at": "2024-01-01T00:00:00Z"
}
```

### POST /users/login
Authenticate and receive JWT token.

**Request:**
```json
{
  "email": "doctor@hospital-a.org",
  "password": "your-password-here"
}
```

**Response (200):**
```json
{
  "access_token": "eyJ...",
  "token_type": "bearer"
}
```

### GET /users/me
Get current authenticated user.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "id": "uuid",
  "email": "doctor@hospital-a.org",
  "full_name": "Dr. Smith",
  "role": "DOCTOR",
  "organization_id": "org-uuid-here",
  "is_active": true,
  "created_at": "2024-01-01T00:00:00Z"
}
```

---

## Health & System

### GET /health
Health check — no auth required.

**Response (200):**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "environment": "development",
  "services": {
    "prediction": "ACTIVE",
    "explainability": "ACTIVE",
    "federated_learning": "SIMULATION",
    "privacy": "ACTIVE",
    "openrouter": "ACTIVE"
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### GET /system/status
Detailed system status — no auth required.

**Response (200):**
```json
{
  "app_name": "HealthFusion_FL",
  "version": "1.0.0",
  "environment": "development",
  "demo_mode": true,
  "uptime_seconds": 3600,
  "model_status": "loaded",
  "federated_status": "idle",
  "database_status": "connected",
  "services": {
    "prediction": "ACTIVE",
    "explainability": "ACTIVE",
    "federated_learning": "SIMULATION",
    "differential_privacy": "PLANNED",
    "secure_aggregation": "PLANNED",
    "audit_logging": "ACTIVE",
    "openrouter_ai": "ACTIVE"
  }
}
```

---

## Prediction

### POST /prediction
Submit patient features for diabetes risk prediction.

**Authorization:** DOCTOR, RESEARCHER, SYSTEM_ADMIN

**Request:**
```json
{
  "gender": "Female",
  "age": 55.0,
  "hypertension": 1,
  "heart_disease": 0,
  "smoking_history": "former",
  "bmi": 29.5,
  "HbA1c_level": 7.2,
  "blood_glucose_level": 180
}
```

**Response (200):**
```json
{
  "prediction": 1,
  "probability": 0.82,
  "risk_level": "high",
  "model_version": "HF-NN-v1.0",
  "timestamp": "2024-01-01T00:00:00Z",
  "explanation_available": true,
  "disclaimer": "This is a model-predicted risk assessment, not a medical diagnosis."
}
```

**Errors:**
- `422`: Invalid input data (missing fields, wrong types)
- `500`: Model not loaded

**Notes:**
- `risk_level`: `"low"` (probability < 0.3), `"moderate"` (0.3-0.7), `"high"` (≥ 0.7)
- Valid `gender` values: `"Female"`, `"Male"`, `"Other"`
- Valid `smoking_history` values: `"never"`, `"former"`, `"current"`, `"ever"`, `"not current"`, `"No Info"`

---

## Explainability

### POST /explainability
Get SHAP-based explanation for a prediction.

**Authorization:** DOCTOR, RESEARCHER, SYSTEM_ADMIN

**Request:** Same as prediction request.

**Response (200):**
```json
{
  "prediction": 1,
  "probability": 0.82,
  "top_features": [
    {
      "feature": "blood_glucose_level",
      "impact": "positive",
      "contribution": 0.234,
      "value": 180.0
    },
    {
      "feature": "HbA1c_level",
      "impact": "positive",
      "contribution": 0.189,
      "value": 7.2
    },
    {
      "feature": "age",
      "impact": "positive",
      "contribution": 0.067,
      "value": 55.0
    },
    {
      "feature": "bmi",
      "impact": "negative",
      "contribution": -0.012,
      "value": 29.5
    }
  ],
  "global_importance": null
}
```

### GET /explainability/global-importance
Get global feature importance across the model.

**Response (200):**
```json
[
  {"feature": "blood_glucose_level", "importance": 0.312, "rank": 1},
  {"feature": "HbA1c_level", "importance": 0.278, "rank": 2},
  {"feature": "age", "importance": 0.134, "rank": 3},
  {"feature": "bmi", "importance": 0.098, "rank": 4},
  {"feature": "smoking_history", "importance": 0.072, "rank": 5},
  {"feature": "hypertension", "importance": 0.051, "rank": 6},
  {"feature": "heart_disease", "importance": 0.033, "rank": 7},
  {"feature": "gender", "importance": 0.022, "rank": 8}
]
```

---

## Federated Learning

### GET /federated/status
Current federated learning status.

**Response (200):**
```json
{
  "status": "completed",
  "current_round": 5,
  "total_rounds": 5,
  "num_clients": 3,
  "strategy": "adaptive_fedavg",
  "mode": "iid",
  "last_updated": "2024-01-01T00:00:00Z"
}
```

### GET /federated/rounds
List all federated rounds.

**Response (200):**
```json
[
  {
    "round_id": 1,
    "round_number": 1,
    "num_clients": 3,
    "global_metrics": {"accuracy": 0.91, "loss": 0.32},
    "client_metrics": [
      {"client_id": "Hospital_A", "accuracy": 0.89, "loss": 0.35, "num_examples": 25638},
      {"client_id": "Hospital_B", "accuracy": 0.92, "loss": 0.28, "num_examples": 25639},
      {"client_id": "Hospital_C", "accuracy": 0.90, "loss": 0.31, "num_examples": 25639}
    ],
    "status": "completed",
    "started_at": "2024-01-01T00:00:00Z",
    "completed_at": "2024-01-01T00:01:00Z"
  }
]
```

### GET /federated/rounds/{round_id}
Get details for a specific round.

### GET /federated/clients
List all federated clients.

**Response (200):**
```json
[
  {
    "client_id": "Hospital_A",
    "name": "Hospital A",
    "organization": "Hospital A Organization",
    "status": "active",
    "last_seen": "2024-01-01T00:00:00Z",
    "total_rounds_participated": 5
  }
]
```

### GET /federated/clients/{client_id}
Get details for a specific client.

### GET /federated/metrics
Aggregated federated metrics summary.

**Response (200):**
```json
{
  "total_rounds": 5,
  "total_clients": 3,
  "best_round": 5,
  "best_accuracy": 0.97,
  "final_metrics": {
    "accuracy": 0.97,
    "precision": 0.95,
    "recall": 0.72,
    "f1": 0.82
  }
}
```

---

## Models

### GET /models
List all model versions.

**Response (200):**
```json
[
  {
    "model_id": "HF-NN-FL-v1.0",
    "version": "1.0",
    "model_type": "neural_network",
    "metrics": {"accuracy": 0.97, "f1": 0.82, "roc_auc": 0.95},
    "training_mode": "federated",
    "status": "ACTIVE",
    "created_at": "2024-01-01T00:00:00Z"
  },
  {
    "model_id": "HF-RF-v1.0",
    "version": "1.0",
    "model_type": "random_forest",
    "metrics": {"accuracy": 0.9695, "f1": 0.7997},
    "training_mode": "centralized",
    "status": "BASELINE",
    "created_at": "2024-01-01T00:00:00Z"
  }
]
```

### GET /models/{model_id}
Get specific model details.

### GET /models/active
Get the currently active model.

---

## Privacy

### GET /privacy/status
Privacy mechanism statuses.

**Response (200):**
```json
{
  "data_locality": {
    "status": "ACTIVE",
    "description": "Raw patient data never leaves hospital nodes"
  },
  "differential_privacy": {
    "status": "SIMULATION",
    "epsilon": 1.0,
    "delta": 1e-5,
    "noise_mechanism": "gaussian"
  },
  "secure_aggregation": {
    "status": "PLANNED",
    "description": "Cryptographic aggregation not yet implemented"
  },
  "audit_logging": {
    "status": "ACTIVE",
    "description": "All system events are logged"
  }
}
```

### GET /privacy/config
Current privacy configuration (no secrets exposed).

---

## Clinical Insights

### POST /insights/generate
Generate structured clinical insight from patient data.

**Request:** Same as prediction request.

**Response (200):**
```json
{
  "risk_level": "high",
  "key_factors": [
    "Elevated blood glucose level (180 mg/dL)",
    "High HbA1c level (7.2%)",
    "History of hypertension"
  ],
  "follow_up_context": [
    "Consider comprehensive metabolic panel",
    "Review current medication regimen",
    "Assess cardiovascular risk factors"
  ],
  "ai_explanation": "Based on the clinical features, this patient shows elevated markers...",
  "model_version": "HF-NN-v1.0",
  "timestamp": "2024-01-01T00:00:00Z",
  "disclaimer": "This is a model-predicted risk assessment, not a medical diagnosis."
}
```

**Notes:**
- `ai_explanation` is null if OpenRouter is unavailable — the insight still works without it.
- The insight service generates deterministic structured output first, then optionally enhances with LLM.

### POST /insights/report
Generate a full assessment report.

**Response (200):**
```json
{
  "assessment_id": "uuid",
  "model_version": "HF-NN-v1.0",
  "prediction": 1,
  "probability": 0.82,
  "risk_level": "high",
  "feature_contributions": [
    {"feature": "blood_glucose_level", "impact": "positive", "contribution": 0.234, "value": 180.0}
  ],
  "insight": {
    "risk_level": "high",
    "key_factors": ["..."],
    "follow_up_context": ["..."]
  },
  "timestamp": "2024-01-01T00:00:00Z",
  "disclaimer": "This is a model-predicted risk assessment, not a medical diagnosis."
}
```

---

## Audit

### GET /audit/events
List audit events with pagination.

**Authorization:** SYSTEM_ADMIN, HOSPITAL_ADMIN

**Query Parameters:**
- `skip` (int, default 0): Offset
- `limit` (int, default 50, max 100): Page size

**Response (200):**
```json
[
  {
    "id": "uuid",
    "timestamp": "2024-01-01T00:00:00Z",
    "actor": "doctor@hospital-a.org",
    "organization": "Hospital A",
    "event_type": "prediction_created",
    "object_type": "prediction",
    "status": "success",
    "metadata": {"model_version": "HF-NN-v1.0", "risk_level": "high"}
  }
]
```

**Event Types:**
- `prediction_created`
- `explanation_generated`
- `model_updated`
- `federated_round_started`
- `federated_round_completed`
- `client_connected`
- `client_failed`
- `admin_login`
- `privacy_configuration_changed`

### GET /audit/events/{event_id}
Get a single audit event.

---

## Organizations

### POST /organizations
Create a new organization.

**Authorization:** SYSTEM_ADMIN

**Request:**
```json
{
  "name": "Hospital A",
  "description": "Regional medical center"
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "name": "Hospital A",
  "description": "Regional medical center",
  "is_active": true,
  "created_at": "2024-01-01T00:00:00Z"
}
```

### GET /organizations
List all organizations.

### GET /organizations/{org_id}
Get organization details.

---

## Error Responses

All errors follow this format:

```json
{
  "detail": "Error description"
}
```

| Status Code | Meaning |
|---|---|
| 400 | Bad request |
| 401 | Unauthorized (missing/invalid token) |
| 403 | Forbidden (insufficient role) |
| 404 | Resource not found |
| 422 | Validation error (invalid input) |
| 500 | Internal server error |

---

## Feature Status Values

| Status | Meaning |
|---|---|
| `ACTIVE` | Fully implemented and operational |
| `SIMULATION` | Implemented but running in simulation mode |
| `PLANNED` | Defined in architecture but not yet implemented |

---

## CORS Configuration

The backend accepts requests from origins configured in `CORS_ORIGINS` environment variable.

Default: `http://localhost:3000,http://localhost:5173`

---

## Rate Limiting

Not currently enforced. Planned for production deployment.

---

## Demo Mode

When `DEMO_MODE=true`, the API uses synthetic data and returns `"environment": "demo"` in health responses.
