from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.schemas.schemas import PredictionRequest, PredictionResponse
from app.services.prediction_service import PredictionService
from app.dependencies import get_prediction_service
from app.core.database import get_db
from app.core.security import get_optional_user
from app.models.database_models import Prediction, User
import datetime

router = APIRouter(tags=["Prediction"])

@router.post("", response_model=PredictionResponse)
async def predict(
    request: PredictionRequest,
    service: PredictionService = Depends(get_prediction_service),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_optional_user),
):
    result = service.predict(request.model_dump())
    
    pred_id = None
    if user:
        db_pred = Prediction(
            user_id=user.id,
            input_data=request.model_dump(),
            prediction=result["prediction"],
            probability=result["probability"] if result.get("probability") is not None else result.get("model_score"),
            risk_level=result["risk_level"],
            created_at=datetime.datetime.utcnow()
        )
        db.add(db_pred)
        await db.commit()
        await db.refresh(db_pred)
        pred_id = db_pred.id
    
    return PredictionResponse(
        id=pred_id,
        prediction=result["prediction"],
        probability=result["probability"] if result.get("probability") is not None else result.get("model_score"),
        risk_level=result["risk_level"],
        model_version=result.get("model_version", "v1.0.0"),
        timestamp=datetime.datetime.utcnow().isoformat(),
        explanation_available=True
    )
