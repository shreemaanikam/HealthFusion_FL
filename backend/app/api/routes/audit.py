from fastapi import APIRouter

router = APIRouter(tags=["Audit"])

@router.get("/events")
async def get_events():
    return []
    
@router.get("/events/{event_id}")
async def get_event(event_id: int):
    return {}
