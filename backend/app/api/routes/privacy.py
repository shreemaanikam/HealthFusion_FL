from fastapi import APIRouter, Depends
from app.schemas.schemas import PrivacyStatusResponse
from app.services.privacy_service import PrivacyService
from app.dependencies import get_privacy_service

router = APIRouter(tags=["Privacy"])


@router.get("/status", response_model=PrivacyStatusResponse)
async def status(service: PrivacyService = Depends(get_privacy_service)):
    """GET /api/privacy/status — current privacy feature statuses."""
    return PrivacyStatusResponse(**service.get_status())


@router.get("/config")
async def config():
    """
    GET /api/privacy/config — detailed privacy control configuration.

    Returns honest operational statuses for each privacy mechanism:
    ACTIVE = implemented and running
    SIMULATION = implemented but not applied to actual training/inference
    PLANNED = architecture defined, not yet implemented
    """
    return {
        "controls": [
            {
                "id":          "data_locality",
                "label":       "Data Locality",
                "description": "Raw patient data never leaves the hospital node. Only model parameter updates (ΔW) are transmitted during federation.",
                "status":      "active",
                "details":     "Enforced by architecture: training pipelines are local-only.",
            },
            {
                "id":          "differential_privacy",
                "label":       "Differential Privacy",
                "description": "Gaussian noise mechanism with bounded gradient clipping calibrated to (ε, δ) privacy budgets.",
                "status":      "simulation",
                "details":     "Noise generation and clipping formulas implemented; gradient perturbation simulated but not applied to live training.",
                "epsilon":     1.0,
                "delta":       1e-5,
            },
            {
                "id":          "secure_aggregation",
                "label":       "Secure Aggregation",
                "description": "Cryptographic multi-party computation prevents the aggregation server from seeing individual client updates.",
                "status":      "planned",
                "details":     "Architecture defined in docs/privacy.md. Requires secret-sharing library (e.g. PySyft or OpenMined).",
            },
            {
                "id":          "audit_logging",
                "label":       "Audit Logging",
                "description": "Immutable timestamped event trail for all predictions, authentication events, and federated rounds.",
                "status":      "active",
                "details":     "Events stored in SQLite audit_events table; queryable via GET /api/audit/events.",
            },
        ],
        "data_handling": {
            "raw_data_sharing": "off",
            "federated_exchange": "on",
            "model_encryption": "planned",
        },
    }
