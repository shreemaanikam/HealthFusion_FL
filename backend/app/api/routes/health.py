from fastapi import APIRouter
from app.config import get_settings
import datetime
import time

router = APIRouter(tags=["Health"])

settings = get_settings()
_START_TIME = time.time()


def _model_status() -> str:
    """Check if the TF/RF model is loaded and available."""
    try:
        from app.services.prediction_service import PredictionService
        svc = PredictionService()
        return "ACTIVE" if svc.is_loaded else "UNAVAILABLE"
    except Exception:
        return "UNAVAILABLE"


def _db_status() -> str:
    """Quick check that the database file exists (sync-safe)."""
    try:
        from pathlib import Path
        db_url = settings.DATABASE_URL
        if "sqlite" in db_url:
            db_path = db_url.replace("sqlite+aiosqlite:///", "").replace("sqlite:///", "")
            return "ACTIVE" if Path(db_path).exists() else "UNAVAILABLE"
        return "ACTIVE"
    except Exception:
        return "UNAVAILABLE"


def _openrouter_status() -> str:
    """Return ACTIVE if OPENROUTER_API_KEY is configured, else INACTIVE."""
    try:
        return "ACTIVE" if bool(settings.OPENROUTER_API_KEY) else "INACTIVE"
    except Exception:
        return "INACTIVE"


@router.get("/health")
async def health_check():
    """GET /api/health — liveness probe with subsystem statuses."""
    model_st = _model_status()
    db_st    = _db_status()
    or_st    = _openrouter_status()

    overall = "healthy" if model_st == "ACTIVE" and db_st == "ACTIVE" else "degraded"

    return {
        "status":      overall,
        "version":     "1.0.0",
        "environment": settings.APP_ENV,
        "services": {
            "prediction":         model_st,
            "explainability":     "ACTIVE",
            "federated_learning": "SIMULATION",
            "privacy":            "ACTIVE",
            "openrouter":         or_st,
            "database":           db_st,
            "audit_logging":      "ACTIVE",
        },
        "timestamp": datetime.datetime.utcnow().isoformat(),
    }


@router.get("/system/status")
async def system_status():
    """GET /api/system/status — comprehensive system state."""
    uptime = int(time.time() - _START_TIME)
    model_st = _model_status()
    db_st    = _db_status()
    or_st    = _openrouter_status()

    try:
        from app.services.prediction_service import PredictionService
        svc = PredictionService()
        model_info = svc.model_info
    except Exception:
        model_info = {"model_type": "unknown", "model_version": "unknown", "loaded": False}

    return {
        "app_name":         settings.APP_NAME,
        "version":          "1.0.0",
        "environment":      settings.APP_ENV,
        "demo_mode":        settings.DEMO_MODE,
        "uptime_seconds":   uptime,
        "model_status":     model_st,
        "model_type":       model_info.get("model_type", "unknown"),
        "model_version":    model_info.get("model_version", "unknown"),
        "federated_status": "SIMULATION",
        "database_status":  db_st,
        "openrouter_status": or_st,
        "services": {
            "prediction":         model_st,
            "explainability":     "ACTIVE",
            "federated_learning": "SIMULATION",
            "differential_privacy": "SIMULATION",
            "secure_aggregation": "PLANNED",
            "audit_logging":      "ACTIVE",
            "openrouter":         or_st,
        },
    }
