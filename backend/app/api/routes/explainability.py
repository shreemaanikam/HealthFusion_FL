from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.schemas.schemas import ExplainRequest, ExplainResponse
from app.services.explainability_service import ExplainabilityService
from app.services.prediction_service import PredictionService
from app.dependencies import get_explainability_service
from app.core.database import get_db
from app.models.database_models import Explanation
import datetime

router = APIRouter(tags=["Explainability"])


@router.post("", response_model=ExplainResponse)
async def explain(
    request: ExplainRequest,
    service: ExplainabilityService = Depends(get_explainability_service),
    db: AsyncSession = Depends(get_db)
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

    explanation_record = None
    if request.prediction_id:
        try:
            pred_id_int = int(request.prediction_id)
            db_exp = Explanation(
                prediction_id=pred_id_int,
                feature_contributions=[c.model_dump() if hasattr(c, "model_dump") else c for c in contributions],
                method="SHAP",
                created_at=datetime.datetime.utcnow()
            )
            db.add(db_exp)
            await db.commit()
        except ValueError:
            pass # Invalid prediction ID

    return ExplainResponse(
        prediction=pred_result.get("prediction", 0),
        probability=pred_result.get("probability") if pred_result.get("probability") is not None else pred_result.get("model_score", 0.0),
        top_features=contributions,
    )


@router.get("/global-importance")
async def global_importance(
    service: ExplainabilityService = Depends(get_explainability_service),
):
    """GET /api/explainability/global-importance — mean absolute SHAP importance."""
    return service.get_global_importance()
