import os

base_dir = "/Users/shreemaanikam/HealthFusion_FL/backend"
os.makedirs(f"{base_dir}/app/core", exist_ok=True)
os.makedirs(f"{base_dir}/app/models", exist_ok=True)
os.makedirs(f"{base_dir}/app/schemas", exist_ok=True)
os.makedirs(f"{base_dir}/app/api/routes", exist_ok=True)
os.makedirs(f"{base_dir}/app/services", exist_ok=True)

files = {}

files[f"{base_dir}/__init__.py"] = ""
files[f"{base_dir}/app/__init__.py"] = ""
files[f"{base_dir}/app/core/__init__.py"] = ""
files[f"{base_dir}/app/models/__init__.py"] = ""
files[f"{base_dir}/app/schemas/__init__.py"] = ""
files[f"{base_dir}/app/api/__init__.py"] = ""
files[f"{base_dir}/app/api/routes/__init__.py"] = ""
files[f"{base_dir}/app/services/__init__.py"] = ""

files[f"{base_dir}/app/config.py"] = """
from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache
from typing import Optional

class Settings(BaseSettings):
    APP_NAME: str = "HealthFusion_FL"
    APP_ENV: str = "development"
    DEMO_MODE: bool = False
    DEBUG: bool = True
    SECRET_KEY: str = "supersecretkey"
    DATABASE_URL: str = "sqlite+aiosqlite:///./healthfusion.db"
    JWT_SECRET_KEY: str = "jwtsecretkey"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    OPENROUTER_API_KEY: Optional[str] = None
    OPENROUTER_MODEL: str = "openai/gpt-3.5-turbo"
    OPENROUTER_BASE_URL: str = "https://openrouter.ai/api/v1"
    
    FEDERATION_MODE: str = "simulation"
    FL_NUM_ROUNDS: int = 5
    FL_MIN_CLIENTS: int = 2
    
    DP_ENABLED: bool = False
    DP_EPSILON: float = 1.0
    
    BACKEND_HOST: str = "0.0.0.0"
    BACKEND_PORT: int = 8000
    CORS_ORIGINS: str = "*"
    LOG_LEVEL: str = "INFO"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

@lru_cache()
def get_settings():
    return Settings()
"""

files[f"{base_dir}/app/main.py"] = """
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.api.routes import health, prediction, explainability, federated, models, privacy, insights, audit, organizations, users
from app.core.logging_config import get_logger
from app.core.database import init_db

logger = get_logger(__name__)
settings = get_settings()

app = FastAPI(title="HealthFusion_FL API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.CORS_ORIGINS.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    return response

@app.on_event("startup")
async def startup_event():
    logger.info(f"Starting {settings.APP_NAME} in {settings.APP_ENV} mode")
    await init_db()

app.include_router(health.router, prefix="/api")
app.include_router(users.router, prefix="/api/users")
app.include_router(organizations.router, prefix="/api/organizations")
app.include_router(prediction.router, prefix="/api/prediction")
app.include_router(explainability.router, prefix="/api/explainability")
app.include_router(federated.router, prefix="/api/federated")
app.include_router(models.router, prefix="/api/models")
app.include_router(privacy.router, prefix="/api/privacy")
app.include_router(insights.router, prefix="/api/insights")
app.include_router(audit.router, prefix="/api/audit")
"""

files[f"{base_dir}/app/core/database.py"] = """
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import get_settings

settings = get_settings()

engine = create_async_engine(settings.DATABASE_URL, echo=False)
SessionLocal = sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)
Base = declarative_base()

async def get_db():
    async with SessionLocal() as session:
        yield session

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
"""

files[f"{base_dir}/app/core/security.py"] = """
from datetime import datetime, timedelta
from typing import Optional, List
from jose import jwt, JWTError
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from app.config import get_settings
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from sqlalchemy import select
import enum

settings = get_settings()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/users/login")

class RoleEnum(str, enum.Enum):
    DOCTOR = "DOCTOR"
    HOSPITAL_ADMIN = "HOSPITAL_ADMIN"
    RESEARCHER = "RESEARCHER"
    SYSTEM_ADMIN = "SYSTEM_ADMIN"

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

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
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Could not validate credentials")

async def get_current_user(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)):
    from app.models.database_models import User
    payload = verify_token(token)
    email: str = payload.get("sub")
    if email is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalars().first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)
    return user

def require_role(*roles: RoleEnum):
    async def role_checker(current_user = Depends(get_current_user)):
        if current_user.role not in [role.value for role in roles]:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough privileges")
        return current_user
    return role_checker
"""

files[f"{base_dir}/app/core/logging_config.py"] = """
import logging
import json
from datetime import datetime

class JSONFormatter(logging.Formatter):
    def format(self, record):
        log_record = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "name": record.name,
            "message": record.getMessage()
        }
        return json.dumps(log_record)

def get_logger(name: str) -> logging.Logger:
    logger = logging.getLogger(name)
    if not logger.handlers:
        handler = logging.StreamHandler()
        handler.setFormatter(JSONFormatter())
        logger.addHandler(handler)
        logger.setLevel(logging.INFO)
    return logger
"""

files[f"{base_dir}/app/models/database_models.py"] = """
from app.core.database import Base
from sqlalchemy import Column, Integer, String, Boolean, Float, ForeignKey, DateTime, JSON, Enum
from sqlalchemy.orm import relationship
import datetime
from app.core.security import RoleEnum

class Organization(Base):
    __tablename__ = "organizations"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    description = Column(String)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    users = relationship("User", back_populates="organization")

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    full_name = Column(String)
    role = Column(Enum(RoleEnum), default=RoleEnum.DOCTOR)
    organization_id = Column(Integer, ForeignKey("organizations.id"))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    organization = relationship("Organization", back_populates="users")

class ModelVersion(Base):
    __tablename__ = "model_versions"
    id = Column(Integer, primary_key=True, index=True)
    model_id = Column(String, index=True)
    version = Column(String)
    model_type = Column(String)
    metrics = Column(JSON)
    training_mode = Column(String)
    status = Column(String)
    artifact_path = Column(String)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class FederatedRound(Base):
    __tablename__ = "federated_rounds"
    id = Column(Integer, primary_key=True, index=True)
    round_number = Column(Integer)
    strategy = Column(String)
    num_clients = Column(Integer)
    global_metrics = Column(JSON)
    status = Column(String)
    started_at = Column(DateTime, default=datetime.datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

class FederatedClient(Base):
    __tablename__ = "federated_clients"
    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(String, unique=True, index=True)
    name = Column(String)
    organization_id = Column(Integer, ForeignKey("organizations.id"))
    status = Column(String)
    last_seen = Column(DateTime)

class ClientMetric(Base):
    __tablename__ = "client_metrics"
    id = Column(Integer, primary_key=True, index=True)
    federated_round_id = Column(Integer, ForeignKey("federated_rounds.id"))
    client_id = Column(String, ForeignKey("federated_clients.client_id"))
    metrics = Column(JSON)
    num_examples = Column(Integer)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Prediction(Base):
    __tablename__ = "predictions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    model_version_id = Column(Integer, ForeignKey("model_versions.id"), nullable=True)
    input_data = Column(JSON)
    prediction = Column(Integer)
    probability = Column(Float)
    risk_level = Column(String)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Explanation(Base):
    __tablename__ = "explanations"
    id = Column(Integer, primary_key=True, index=True)
    prediction_id = Column(Integer, ForeignKey("predictions.id"))
    feature_contributions = Column(JSON)
    top_positive = Column(JSON)
    top_negative = Column(JSON)
    method = Column(String)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class AuditEvent(Base):
    __tablename__ = "audit_events"
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    actor_id = Column(Integer, nullable=True)
    organization_id = Column(Integer, nullable=True)
    event_type = Column(String)
    object_type = Column(String)
    object_id = Column(String)
    status = Column(String)
    metadata_ = Column("metadata", JSON) # Renamed attribute to avoid conflict with Base.metadata

class SystemEvent(Base):
    __tablename__ = "system_events"
    id = Column(Integer, primary_key=True, index=True)
    event_type = Column(String)
    severity = Column(String)
    message = Column(String)
    metadata_ = Column("metadata", JSON)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
"""

files[f"{base_dir}/app/schemas/schemas.py"] = """
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class HealthResponse(BaseModel):
    status: str
    version: str
    environment: str
    services: Dict[str, str]
    timestamp: str

class PredictionRequest(BaseModel):
    gender: str
    age: float
    hypertension: int
    heart_disease: int
    smoking_history: str
    bmi: float
    HbA1c_level: float
    blood_glucose_level: float

class PredictionResponse(BaseModel):
    prediction: int
    probability: float
    risk_level: str
    model_version: str
    timestamp: str
    explanation_available: bool
    disclaimer: str = "This is a model-predicted risk assessment, not a medical diagnosis."

class FeatureContribution(BaseModel):
    feature: str
    impact: str
    contribution: float
    value: float

class ExplainRequest(PredictionRequest):
    pass

class ExplainResponse(BaseModel):
    prediction: int
    probability: float
    top_features: List[FeatureContribution]
    global_importance: Optional[List[Dict[str, Any]]] = None

class FederatedStatusResponse(BaseModel):
    status: str
    current_round: int
    total_rounds: int
    num_clients: int
    strategy: str
    mode: str
    last_updated: str

class FederatedRoundResponse(BaseModel):
    round_id: int
    round_number: int
    num_clients: int
    global_metrics: Dict[str, Any]
    client_metrics: Dict[str, Any]
    status: str
    started_at: datetime
    completed_at: Optional[datetime]

class FederatedClientResponse(BaseModel):
    client_id: str
    name: str
    organization: str
    status: str
    last_seen: datetime
    total_rounds_participated: int

class ModelVersionResponse(BaseModel):
    model_id: str
    version: str
    model_type: str
    metrics: Dict[str, Any]
    training_mode: str
    status: str
    created_at: datetime

class PrivacyStatusResponse(BaseModel):
    data_locality: str
    differential_privacy: str
    secure_aggregation: str
    audit_logging: str

class InsightResponse(BaseModel):
    risk_level: str
    key_factors: List[str]
    follow_up_context: List[str]
    ai_explanation: Optional[str] = None
    model_version: str
    timestamp: str
    disclaimer: str = "This is a model-predicted risk assessment, not a medical diagnosis."

class AuditEventResponse(BaseModel):
    id: int
    timestamp: datetime
    actor: Optional[str]
    organization: Optional[str]
    event_type: str
    object_type: str
    status: str
    metadata: Dict[str, Any]

class ReportResponse(BaseModel):
    assessment_id: str
    model_version: str
    prediction: int
    probability: float
    risk_level: str
    feature_contributions: List[FeatureContribution]
    insight: InsightResponse
    timestamp: str
    disclaimer: str = "This is a model-predicted risk assessment, not a medical diagnosis."

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: str
    organization_id: Optional[int] = None

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    full_name: str
    role: str
    is_active: bool
    created_at: datetime

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str

class OrganizationCreate(BaseModel):
    name: str
    description: str

class OrganizationResponse(BaseModel):
    id: int
    name: str
    description: str
    is_active: bool
    created_at: datetime

class SystemStatusResponse(BaseModel):
    app_name: str
    version: str
    environment: str
    demo_mode: bool
    uptime_seconds: int
    model_status: str
    federated_status: str
    database_status: str
    services: Dict[str, str]
"""

files[f"{base_dir}/app/dependencies.py"] = """
from app.services.prediction_service import PredictionService
from app.services.explainability_service import ExplainabilityService
from app.services.federated_service import FederatedService
from app.services.model_service import ModelService
from app.services.privacy_service import PrivacyService
from app.services.insight_service import InsightService
from app.services.openrouter_service import OpenRouterService
from app.services.audit_service import AuditService
from app.services.report_service import ReportService
from app.services.organization_service import OrganizationService
from app.services.user_service import UserService

def get_prediction_service() -> PredictionService:
    return PredictionService()

def get_explainability_service() -> ExplainabilityService:
    return ExplainabilityService()

def get_federated_service() -> FederatedService:
    return FederatedService()

def get_model_service() -> ModelService:
    return ModelService()

def get_privacy_service() -> PrivacyService:
    return PrivacyService()

def get_insight_service() -> InsightService:
    return InsightService()

def get_openrouter_service() -> OpenRouterService:
    return OpenRouterService()

def get_audit_service() -> AuditService:
    return AuditService()

def get_report_service() -> ReportService:
    return ReportService()

def get_organization_service() -> OrganizationService:
    return OrganizationService()

def get_user_service() -> UserService:
    return UserService()
"""

for path, content in files.items():
    with open(path, "w") as f:
        f.write(content.strip() + "\n")
