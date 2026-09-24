from fastapi import APIRouter
from app.schemas.schemas import HealthResponse, SystemStatusResponse
import datetime

router = APIRouter(tags=["Health"])

@router.get("/health", response_model=HealthResponse)
async def health_check():
    return HealthResponse(
        status="ok",
        version="1.0.0",
        environment="development",
        services={"database": "ACTIVE"},
        timestamp=datetime.datetime.utcnow().isoformat()
    )
    
@router.get("/system/status", response_model=SystemStatusResponse)
async def system_status():
    return SystemStatusResponse(
        app_name="HealthFusion_FL",
        version="1.0.0",
        environment="development",
        demo_mode=False,
        uptime_seconds=100,
        model_status="ACTIVE",
        federated_status="ACTIVE",
        database_status="ACTIVE",
        services={}
    )
