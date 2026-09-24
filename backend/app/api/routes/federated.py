from fastapi import APIRouter, Depends
from app.schemas.schemas import FederatedStatusResponse
from app.services.federated_service import FederatedService
from app.dependencies import get_federated_service

router = APIRouter(tags=["Federated"])

@router.get("/status", response_model=FederatedStatusResponse)
async def status(service: FederatedService = Depends(get_federated_service)):
    return FederatedStatusResponse(**service.get_status())

@router.get("/rounds")
async def rounds():
    return []
    
@router.get("/rounds/{round_id}")
async def round(round_id: int):
    return {}
    
@router.get("/clients")
async def clients():
    return []
    
@router.get("/clients/{client_id}")
async def client(client_id: str):
    return {}
    
@router.get("/metrics")
async def metrics():
    return {}
