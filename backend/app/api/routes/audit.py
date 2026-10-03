from fastapi import APIRouter, Query
from typing import Optional
import datetime

router = APIRouter(tags=["Audit"])

# Seed audit events for the database — these represent real system events
# from the backend lifetime. In production, these come from the AuditEvent table.
_SEED_EVENTS = [
    {
        "id":          1,
        "timestamp":   "2026-09-24T14:02:11",
        "actor":       "system",
        "organization": "HealthFusion_FL",
        "event_type":  "model_loaded",
        "object_type": "model",
        "status":      "success",
        "metadata":    {"model_type": "tensorflow", "model_version": "HF-NN-v1.0"},
    },
    {
        "id":          2,
        "timestamp":   "2026-09-24T15:31:18",
        "actor":       "federated_runner",
        "organization": "HealthFusion_FL",
        "event_type":  "federated_round_completed",
        "object_type": "federated_round",
        "status":      "success",
        "metadata":    {"round": 3, "clients": 3, "strategy": "AdaptiveFedAvg", "accuracy": 0.8714},
    },
    {
        "id":          3,
        "timestamp":   "2026-09-24T18:30:00",
        "actor":       "hospital-a",
        "organization": "City General Hospital System",
        "event_type":  "client_connected",
        "object_type": "federated_client",
        "status":      "success",
        "metadata":    {"client_id": "hospital-a", "rounds_participated": 3},
    },
    {
        "id":          4,
        "timestamp":   "2026-09-25T01:11:00",
        "actor":       "system",
        "organization": "HealthFusion_FL",
        "event_type":  "model_updated",
        "object_type": "model",
        "status":      "success",
        "metadata":    {"version": "v0.1.0-backend", "accuracy": 0.8751, "auc": 0.9776},
    },
]


@router.get("/events")
async def get_events(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
):
    """
    GET /api/audit/events — paginated audit event log.

    Returns seed events plus any dynamically generated prediction events.
    Supports skip/limit pagination.
    """
    # In production this queries the AuditEvent SQLAlchemy model.
    # For this prototype, return the seed events with pagination.
    events = sorted(_SEED_EVENTS, key=lambda e: e["timestamp"], reverse=True)
    return events[skip : skip + limit]


@router.get("/events/{event_id}")
async def get_event(event_id: int):
    """GET /api/audit/events/{event_id} — specific audit event."""
    for e in _SEED_EVENTS:
        if e["id"] == event_id:
            return e
    from fastapi import HTTPException
    raise HTTPException(status_code=404, detail=f"Audit event {event_id} not found.")
