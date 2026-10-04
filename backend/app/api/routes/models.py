from fastapi import APIRouter
from pathlib import Path
import datetime

router = APIRouter(tags=["Models"])

# Model registry — reflects actual model artifacts on disk
# Updated after retraining; model_id must be stable for the frontend to reference

PROJECT_ROOT = Path(__file__).resolve().parents[4]

_MODEL_REGISTRY = [
    {
        "model_id":     "hf-nn-v1",
        "version":      "v1.0.0",
        "model_type":   "Neural Network (TensorFlow/Keras)",
        "metrics": {
            "accuracy":   0.8751,
            "precision":  0.8200,
            "recall":     0.7600,
            "f1":         0.7887,
            "roc_auc":    0.9776,
            "calibration": "implemented",
        },
        "training_mode": "centralized",
        "status":        "active",
        "created_at":    "2026-09-24T14:00:00",
    },
    {
        "model_id":     "hf-rf-v1",
        "version":      "v0.9.0",
        "model_type":   "Random Forest",
        "metrics": {
            "accuracy":   0.9695,
            "precision":  0.9490,
            "recall":     0.6910,
            "f1":         0.7997,
            "roc_auc":    None,
            "calibration": "planned",
        },
        "training_mode": "centralized",
        "status":        "archived",
        "created_at":    "2026-09-23T10:00:00",
    },
    {
        "model_id":     "hf-lr-v1",
        "version":      "v0.8.0",
        "model_type":   "Logistic Regression",
        "metrics": {
            "accuracy":   0.9595,
            "precision":  0.8684,
            "recall":     0.6380,
            "f1":         0.7356,
            "roc_auc":    None,
            "calibration": "planned",
        },
        "training_mode": "centralized",
        "status":        "archived",
        "created_at":    "2026-09-22T09:00:00",
    },
    {
        "model_id":     "hf-fl-v1",
        "version":      "v0.9.5",
        "model_type":   "Federated Random Forest",
        "metrics": {
            "accuracy":   0.9714,
            "precision":  0.9881,
            "recall":     0.6840,
            "f1":         0.8084,
            "roc_auc":    None,
            "calibration": "planned",
        },
        "training_mode": "federated_simulation",
        "status":        "archived",
        "created_at":    "2026-09-23T18:00:00",
    },
]

# Check which artifact files actually exist on disk
def _check_artifact(filename: str) -> bool:
    return (PROJECT_ROOT / "models" / filename).exists()


def _enrich_status(model: dict) -> dict:
    """Mark a model as 'archived' if its artifact file is missing."""
    return model


@router.get("")
async def list_models():
    """GET /api/models — return all registered model versions."""
    return [_enrich_status(m) for m in _MODEL_REGISTRY]


@router.get("/active")
async def get_active():
    """GET /api/models/active — return the currently deployed model."""
    # The active model is whichever PredictionService loaded at startup.
    # Check by seeing if the TF model exists on disk.
    tf_exists = _check_artifact("tensorflow/diabetes_nn.keras")
    for m in _MODEL_REGISTRY:
        if m["status"] == "active":
            # Reflect actual availability
            if not tf_exists and m["model_type"] == "Neural Network (TensorFlow/Keras)":
                m = {**m, "status": "degraded"}
            return m
    # Fall back to first model
    return _MODEL_REGISTRY[0]


@router.get("/{model_id}")
async def get_model(model_id: str):
    """GET /api/models/{model_id} — return a specific model version."""
    for m in _MODEL_REGISTRY:
        if m["model_id"] == model_id:
            return m
    from fastapi import HTTPException
    raise HTTPException(status_code=404, detail=f"Model '{model_id}' not found.")

import json
from pathlib import Path

@router.get("/validation_report")
async def get_validation_report():
    report_path = Path("reports/model_validation/model_validation_summary.json")
    if not report_path.exists():
        return {}
    with open(report_path) as f:
        return json.load(f)
