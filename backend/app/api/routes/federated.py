from fastapi import APIRouter, Depends
from app.schemas.schemas import FederatedStatusResponse
from app.services.federated_service import FederatedService
from app.dependencies import get_federated_service
import datetime

router = APIRouter(tags=["Federated"])

# Simulated hospital clients — 3 nodes matching the training configuration
_SIMULATED_CLIENTS = [
    {
        "client_id":                   "hospital-a",
        "name":                        "City General Hospital",
        "organization":                "City General Hospital System",
        "status":                      "connected",
        "last_seen":                   "2026-09-24T18:30:00",
        "total_rounds_participated":   3,
        "model_version":               "v1.0.0",
        "reliability_score":           0.92,
        "contribution_weight":         0.42,
        "city":                        "Mumbai",
        "validation": {
            "accuracy": 0.8803,
            "loss":     0.2541,
            "auc":      0.9714,
        },
        "data_distribution_summary": {
            "record_count":  38458,
            "positive_rate": 0.089,
            "note":          "IID partition — balanced class distribution",
        },
    },
    {
        "client_id":                   "hospital-b",
        "name":                        "Regional Diabetes Clinic",
        "organization":                "Regional Specialty Care Network",
        "status":                      "connected",
        "last_seen":                   "2026-09-24T18:28:00",
        "total_rounds_participated":   3,
        "model_version":               "v1.0.0",
        "reliability_score":           0.88,
        "contribution_weight":         0.38,
        "city":                        "Delhi",
        "validation": {
            "accuracy": 0.8612,
            "loss":     0.3142,
            "auc":      0.9421,
        },
        "data_distribution_summary": {
            "record_count":  28843,
            "positive_rate": 0.142,
            "note":          "Non-IID: higher positive rate (specialized diabetic clinic population)",
        },
    },
    {
        "client_id":                   "hospital-c",
        "name":                        "Primary Care Associates",
        "organization":                "Community Health Partners",
        "status":                      "connected",
        "last_seen":                   "2026-09-24T18:25:00",
        "total_rounds_participated":   2,
        "model_version":               "v1.0.0",
        "reliability_score":           0.79,
        "contribution_weight":         0.20,
        "city":                        "Chennai",
        "validation": {
            "accuracy": 0.8489,
            "loss":     0.3398,
            "auc":      0.9188,
        },
        "data_distribution_summary": {
            "record_count":  19245,
            "positive_rate": 0.061,
            "note":          "Non-IID: younger demographic, lower positive rate",
        },
    },
]

# Simulated federated rounds
_SIMULATED_ROUNDS = [
    {
        "round_id":            1,
        "round_number":        1,
        "num_clients":         3,
        "global_metrics": {
            "accuracy": 0.8489,
            "loss":     0.3311,
            "auc":      0.9322,
        },
        "client_metrics": {
            "hospital-a": {"accuracy": 0.8512, "loss": 0.3280},
            "hospital-b": {"accuracy": 0.8423, "loss": 0.3498},
            "hospital-c": {"accuracy": 0.8489, "loss": 0.3156},
        },
        "aggregation_strategy": "AdaptiveFedAvg",
        "status":        "completed",
        "started_at":    "2026-09-24T15:00:00",
        "completed_at":  "2026-09-24T15:08:22",
    },
    {
        "round_id":            2,
        "round_number":        2,
        "num_clients":         3,
        "global_metrics": {
            "accuracy": 0.8631,
            "loss":     0.3102,
            "auc":      0.9511,
        },
        "client_metrics": {
            "hospital-a": {"accuracy": 0.8720, "loss": 0.2980},
            "hospital-b": {"accuracy": 0.8601, "loss": 0.3241},
            "hospital-c": {"accuracy": 0.8572, "loss": 0.3085},
        },
        "aggregation_strategy": "AdaptiveFedAvg",
        "status":        "completed",
        "started_at":    "2026-09-24T15:10:00",
        "completed_at":  "2026-09-24T15:19:45",
    },
    {
        "round_id":            3,
        "round_number":        3,
        "num_clients":         3,
        "global_metrics": {
            "accuracy": 0.8714,
            "loss":     0.2897,
            "auc":      0.9621,
        },
        "client_metrics": {
            "hospital-a": {"accuracy": 0.8803, "loss": 0.2541},
            "hospital-b": {"accuracy": 0.8612, "loss": 0.3142},
            "hospital-c": {"accuracy": 0.8489, "loss": 0.3398},
        },
        "aggregation_strategy": "AdaptiveFedAvg",
        "status":        "completed",
        "started_at":    "2026-09-24T15:22:00",
        "completed_at":  "2026-09-24T15:31:18",
    },
]


@router.get("/status", response_model=FederatedStatusResponse)
async def status(service: FederatedService = Depends(get_federated_service)):
    """GET /api/federated/status — current federation status."""
    return FederatedStatusResponse(**service.get_status())


@router.get("/rounds")
async def rounds():
    """GET /api/federated/rounds — all completed/scheduled rounds."""
    return _SIMULATED_ROUNDS


@router.get("/rounds/{round_id}")
async def get_round(round_id: int):
    """GET /api/federated/rounds/{round_id} — specific round details."""
    for r in _SIMULATED_ROUNDS:
        if r["round_id"] == round_id:
            return r
    from fastapi import HTTPException
    raise HTTPException(status_code=404, detail=f"Round {round_id} not found.")


@router.get("/clients")
async def clients():
    """GET /api/federated/clients — all simulated hospital clients."""
    return _SIMULATED_CLIENTS


@router.get("/clients/{client_id}")
async def client(client_id: str):
    """GET /api/federated/clients/{client_id} — specific hospital client."""
    for c in _SIMULATED_CLIENTS:
        if c["client_id"] == client_id:
            return c
    from fastapi import HTTPException
    raise HTTPException(status_code=404, detail=f"Client '{client_id}' not found.")


@router.get("/metrics")
async def metrics():
    """GET /api/federated/metrics — aggregate federation metrics."""
    latest_round = _SIMULATED_ROUNDS[-1]
    return {
        "global_accuracy":    latest_round["global_metrics"]["accuracy"],
        "global_loss":        latest_round["global_metrics"]["loss"],
        "global_auc":         latest_round["global_metrics"]["auc"],
        "participation_rate": 1.0,   # all 3 clients participated in round 3
        "active_clients":     3,
        "total_clients":      3,
        "total_rounds":       len(_SIMULATED_ROUNDS),
        "current_round":      len(_SIMULATED_ROUNDS),
        "aggregation_strategy": "AdaptiveFedAvg",
        "mode":               "SIMULATION",
    }
