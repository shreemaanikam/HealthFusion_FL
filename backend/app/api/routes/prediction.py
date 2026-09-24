from fastapi import APIRouter, Depends
from app.schemas.schemas import PredictionRequest, PredictionResponse
from app.services.prediction_service import PredictionService
from app.dependencies import get_prediction_service
import datetime

router = APIRouter(tags=["Prediction"])

@router.post("", response_model=PredictionResponse)
async def predict(request: PredictionRequest, service: PredictionService = Depends(get_prediction_service)):
    result = service.predict(request.model_dump())
    return PredictionResponse(
        prediction=result["prediction"],
        probability=result["probability"],
        risk_level=result["risk_level"],
        model_version="v1.0.0",
        timestamp=datetime.datetime.utcnow().isoformat(),
        explanation_available=True
    )
