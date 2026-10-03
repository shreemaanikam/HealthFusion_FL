from fastapi import APIRouter
from sqlalchemy import text

from app.config import get_settings
from app.core.database import engine
import datetime
import time

router = APIRouter(tags=["Health"])

settings = get_settings()
_START_TIME = time.time()
VERSION = "1.0.0"


def _model_status() -> str:
    """ACTIVE only if the prediction model actually loaded."""
    try:
        from app.services.prediction_service import PredictionService
        return "ACTIVE" if PredictionService().is_loaded else "UNAVAILABLE"
    except Exception:
        return "UNAVAILABLE"


async def _db_status() -> str:
    """Run a real round-trip query against the configured database."""
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        return "ACTIVE"
    except Exception:
        return "UNAVAILABLE"


def _openrouter_status() -> str:
    """CONFIGURED means a key is present; it is optional and never required for prediction."""
    return "ACTIVE" if bool(settings.OPENROUTER_API_KEY) else "INACTIVE"


@router.get("/health")
async def health_check():
    """Liveness/readiness probe with real subsystem checks."""
    model_st = _model_status()
    db_st = await _db_status()
    overall = "healthy" if model_st == "ACTIVE" and db_st == "ACTIVE" else "degraded"
    return {
        "status": overall,
        "version": VERSION,
        "environment": settings.APP_ENV,
        "services": {
            "prediction": model_st,
            "explainability": model_st,
            "federated_learning": "SIMULATION",
            "privacy": "ACTIVE",
            "openrouter": _openrouter_status(),
            "database": db_st,
            "audit_logging": "ACTIVE",
        },
        "timestamp": datetime.datetime.utcnow().isoformat(),
    }


@router.get("/system/status")
async def system_status():
    """Detailed, non-sensitive system state (no secrets, paths, or connection strings)."""
    model_st = _model_status()
    db_st = await _db_status()
    or_st = _openrouter_status()

    try:
        from app.services.prediction_service import PredictionService
        model_info = PredictionService().model_info
    except Exception:
        model_info = {}

    return {
        "app_name": settings.APP_NAME,
        "version": VERSION,
        "environment": settings.APP_ENV,
        "demo_mode": settings.DEMO_MODE,
        "uptime_seconds": int(time.time() - _START_TIME),
        "model_status": model_st,
        "model_type": model_info.get("model_type", "unknown"),
        "model_version": model_info.get("model_version", "unknown"),
        "federated_status": "SIMULATION",
        "database_status": db_st,
        "openrouter_status": or_st,
        "services": {
            "prediction": model_st,
            "explainability": model_st,
            "federated_learning": "SIMULATION",
            "differential_privacy": "SIMULATION",
            "secure_aggregation": "PLANNED",
            "audit_logging": "ACTIVE",
            "openrouter": or_st,
        },
    }
