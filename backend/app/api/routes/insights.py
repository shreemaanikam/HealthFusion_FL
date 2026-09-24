from fastapi import APIRouter

router = APIRouter(tags=["Insights"])

@router.post("/generate")
async def generate():
    return {}
    
@router.post("/report")
async def report():
    return {}
