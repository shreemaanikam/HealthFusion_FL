from datetime import datetime, timedelta
from typing import Optional, List
from jose import jwt, JWTError
import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from app.config import get_settings
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from sqlalchemy import select
import enum

settings = get_settings()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/users/login")
# Same scheme, but a missing token yields None instead of 401 (used where
# authentication is optional, e.g. self-registration).
oauth2_scheme_optional = OAuth2PasswordBearer(tokenUrl="api/users/login", auto_error=False)

_UNAUTHORIZED_HEADERS = {"WWW-Authenticate": "Bearer"}


class RoleEnum(str, enum.Enum):
    DOCTOR = "DOCTOR"
    HOSPITAL_ADMIN = "HOSPITAL_ADMIN"
    RESEARCHER = "RESEARCHER"
    SYSTEM_ADMIN = "SYSTEM_ADMIN"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))

def get_password_hash(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt

def verify_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers=_UNAUTHORIZED_HEADERS,
        )

async def _user_from_token(token: str, db: AsyncSession):
    """Resolve a bearer token to an active user, or raise 401/403.

    The user's role is always read from the database, never trusted from the
    token, so a role change or account disablement takes effect immediately.
    """
    from app.models.database_models import User
    payload = verify_token(token)
    email: str = payload.get("sub")
    if email is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers=_UNAUTHORIZED_HEADERS,
        )
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalars().first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers=_UNAUTHORIZED_HEADERS,
        )
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is disabled.")
    return user

async def get_current_user(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)):
    return await _user_from_token(token, db)

async def get_optional_user(token: Optional[str] = Depends(oauth2_scheme_optional), db: AsyncSession = Depends(get_db)):
    """Return the authenticated user, or None if no token was sent.

    A token that IS sent but is invalid/expired still raises 401 -- it is never
    silently treated as anonymous.
    """
    if token is None:
        return None
    return await _user_from_token(token, db)

def require_role(*roles: RoleEnum):
    allowed = {role.value for role in roles}

    async def role_checker(current_user = Depends(get_current_user)):
        user_role = getattr(current_user.role, "value", current_user.role)
        if user_role not in allowed:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough privileges")
        return current_user
    return role_checker
