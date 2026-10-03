# HealthFusion_FL — User Access Guide

HealthFusion_FL is an **AI-assisted clinical decision-support research prototype**. It shows
*model-predicted risk* for diabetes screening. It is not a medical diagnosis, has not been
clinically validated, and should not replace clinical judgment.

All you need is a web browser — nothing to install.

## Public visitor

Homepage → read *Product*, *How it works*, *Privacy*, *Research* → **Demo** or **Login** (or *Request a pilot*).

## Doctor (`DOCTOR`)

Login → Dashboard → **Assessment** (enter patient values) → **Prediction** (risk level + probability) →
**Explainability** (which factors drove the result) → **Insight** (plain-language summary and follow-up considerations) → **Report** (print / export).

Note: assessment results are kept for the current browser session; the backend does not yet store a retrievable assessment history.

## Hospital administrator (`HOSPITAL_ADMIN`)

Login → Dashboard → **Federated network** (participating hospitals) → **Rounds** → **Models** → **Privacy** → **Audit**.

Federated learning is currently a **simulation**; the UI labels it as such.

## Researcher (`RESEARCHER`)

Login → **Models** (comparison) → **Explainability** (global feature importance) → **Federated metrics**.

## System administrator (`SYSTEM_ADMIN`)

Login → **System** status (health of model, database, AI service) and **Audit**.

## Accounts

Accounts are created via `POST /api/users/register`. Roles are enforced by the backend, not just hidden in the UI.

## Feature status

| Capability | Status |
|-----------|--------|
| Risk prediction (TensorFlow) | Active |
| SHAP explanations | Active |
| Clinical insight text | Active (rule-based; AI wording when OpenRouter is configured) |
| Federated learning | Simulation |
| Differential privacy | Simulation |
| Secure aggregation | Planned |
| Authentication / roles | Active |
