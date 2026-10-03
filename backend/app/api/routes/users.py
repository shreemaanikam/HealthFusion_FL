from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import timedelta
from typing import Optional

from app.core.database import get_db
from app.core.permissions import SELF_REGISTER_ROLE, USER_PROVISIONERS
from app.core.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    get_current_user,
    get_optional_user,
    RoleEnum,
)
from app.models.database_models import User, Organization
from app.schemas.schemas import UserCreate, UserResponse, UserLogin, TokenResponse
from app.config import get_settings

settings = get_settings()
router = APIRouter(tags=["Users"])


@router.post("/register", response_model=UserResponse, status_code=201)
async def register(
    payload: UserCreate,
    db: AsyncSession = Depends(get_db),
    caller: Optional[User] = Depends(get_optional_user),
):
    """Create a new user account.

    Anyone may self-register as DOCTOR (least privilege). Creating an account
    with any other role requires an authenticated SYSTEM_ADMIN; otherwise
    RBAC could be bypassed by simply registering as an administrator.
    """
    # Validate role first (cheap, and avoids leaking whether an email exists)
    try:
        role_enum = RoleEnum(payload.role.upper())
    except ValueError:
        raise HTTPException(status_code=422, detail=f"Invalid role '{payload.role}'. Must be one of: DOCTOR, HOSPITAL_ADMIN, RESEARCHER, SYSTEM_ADMIN.")

    if role_enum != SELF_REGISTER_ROLE:
        caller_role = getattr(caller.role, "value", None) if caller else None
        if caller_role not in {r.value for r in USER_PROVISIONERS}:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only a system administrator can create accounts with this role.",
            )

    # Check email uniqueness
    existing = await db.execute(select(User).where(User.email == payload.email))
    if existing.scalars().first():
        raise HTTPException(status_code=400, detail="Email address already registered.")

    user = User(
        email=payload.email,
        hashed_password=get_password_hash(payload.password),
        full_name=payload.full_name,
        role=role_enum,
        organization_id=payload.organization_id,
        is_active=True,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return UserResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role.value,
        is_active=user.is_active,
        created_at=user.created_at,
    )


@router.post("/login", response_model=TokenResponse)
async def login(payload: UserLogin, db: AsyncSession = Depends(get_db)):
    """Authenticate and return a JWT Bearer token."""
    result = await db.execute(select(User).where(User.email == payload.email))
    user = result.scalars().first()

    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is disabled.")

    access_token = create_access_token(
        data={"sub": user.email, "role": user.role.value},
        expires_delta=timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    return TokenResponse(access_token=access_token, token_type="bearer")


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """Return the profile of the currently authenticated user."""
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role.value,
        is_active=current_user.is_active,
        created_at=current_user.created_at,
    )
