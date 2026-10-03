from pydantic import BaseModel, EmailStr, Field, model_validator, ConfigDict
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

    model_config = ConfigDict(populate_by_name=True)

    @model_validator(mode="before")
    @classmethod
    def normalize_fields(cls, data: Any) -> Any:
        """Accept camelCase field names from the frontend and normalize to snake_case."""
        if isinstance(data, dict):
            mapping = {
                "heartDisease": "heart_disease",
                "smokingHistory": "smoking_history",
                "hba1cLevel": "HbA1c_level",
                "bloodGlucoseLevel": "blood_glucose_level",
            }
            for camel, snake in mapping.items():
                if camel in data and snake not in data:
                    data[snake] = data.pop(camel)
        return data


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


class ExplainRequest(BaseModel):
    """Shape the frontend actually sends: {input: {...}, predictionId?: string}."""

    input: PredictionRequest
    prediction_id: Optional[str] = Field(None, alias="predictionId")

    model_config = ConfigDict(populate_by_name=True)


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


class InsightRequest(BaseModel):
    """Payload the frontend sends to /api/insights/generate and /report."""

    risk_level: Optional[str] = None
    probability: Optional[float] = None
    feature_contributions: Optional[List[Dict[str, Any]]] = None
    assessment_id: Optional[str] = Field(None, alias="assessmentId")

    model_config = ConfigDict(populate_by_name=True)


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
