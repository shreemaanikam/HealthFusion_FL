from fastapi import APIRouter, Depends
from app.schemas.schemas import ExplainRequest, ExplainResponse
from app.services.explainability_service import ExplainabilityService
from app.services.prediction_service import PredictionService
from app.dependencies import get_explainability_service

router = APIRouter(tags=["Explainability"])


@router.post("", response_model=ExplainResponse)
async def explain(
    request: ExplainRequest,
    service: ExplainabilityService = Depends(get_explainability_service),
):
    """
    POST /api/explainability

    Accepts the clinical input nested under an "input" key:
      { input: {...snake_case_fields}, prediction_id?: str }

    Returns SHAP feature contributions and the prediction result.
    """
    # Get actual prediction for this input
    pred_service = PredictionService()
    pred_result = pred_service.predict(request.input.model_dump())

    # Get SHAP feature contributions
    contributions = service.explain_prediction(request.input.model_dump(), pred_service._model)

    return ExplainResponse(
        prediction=pred_result.get("prediction", 0),
        probability=pred_result.get("probability", 0.0),
        top_features=contributions,
    )


@router.get("/global-importance")
async def global_importance(
    service: ExplainabilityService = Depends(get_explainability_service),
):
    """GET /api/explainability/global-importance — mean absolute SHAP importance."""
    return service.get_global_importance()
