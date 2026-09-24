from fastapi import APIRouter

router = APIRouter(tags=["Organizations"])

@router.get("")
async def get_orgs():
    return []
    
@router.post("")
async def create_org():
    return {}
    
@router.get("/{org_id}")
async def get_org(org_id: int):
    return {}
