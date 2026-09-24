from fastapi import APIRouter, Depends
from app.schemas.schemas import PrivacyStatusResponse
from app.services.privacy_service import PrivacyService
from app.dependencies import get_privacy_service

router = APIRouter(tags=["Privacy"])

@router.get("/status", response_model=PrivacyStatusResponse)
async def status(service: PrivacyService = Depends(get_privacy_service)):
    return PrivacyStatusResponse(**service.get_status())
    
@router.get("/config")
async def config():
    return {}
