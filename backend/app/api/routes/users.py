from fastapi import APIRouter

router = APIRouter(tags=["Users"])

@router.post("/register")
async def register():
    return {}
    
@router.post("/login")
async def login():
    return {}
    
@router.get("/me")
async def me():
    return {}
