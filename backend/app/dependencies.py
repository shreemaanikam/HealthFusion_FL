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
