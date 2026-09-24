from fastapi import APIRouter

router = APIRouter(tags=["Models"])

@router.get("")
async def list_models():
    return []
    
@router.get("/active")
async def get_active():
    return {}
    
@router.get("/{model_id}")
async def get_model(model_id: str):
    return {}
