from fastapi import APIRouter, Depends
from app.schemas.schemas import ExplainRequest, ExplainResponse
from app.services.explainability_service import ExplainabilityService
from app.dependencies import get_explainability_service

router = APIRouter(tags=["Explainability"])

@router.post("", response_model=ExplainResponse)
async def explain(request: ExplainRequest, service: ExplainabilityService = Depends(get_explainability_service)):
    contributions = service.explain_prediction(request.model_dump(), None)
    return ExplainResponse(
        prediction=0,
        probability=0.42,
        top_features=contributions
    )

@router.get("/global-importance")
async def global_importance(service: ExplainabilityService = Depends(get_explainability_service)):
    return service.get_global_importance()
