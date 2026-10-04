from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.database_models import Prediction, User
from app.schemas.assessments import AssessmentHistoryResponse

router = APIRouter(tags=["Assessments"])

@router.get("", response_model=List[AssessmentHistoryResponse])
async def get_assessments(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    GET /api/assessments
    Returns the prediction history for the authenticated user.
    """
    result = await db.execute(
        select(Prediction)
        .where(Prediction.user_id == user.id)
        .order_by(Prediction.created_at.desc())
    )
    predictions = result.scalars().all()
    
    return [
        AssessmentHistoryResponse(
            id=p.id,
            input_data=p.input_data,
            prediction=p.prediction,
            probability=p.probability,
            risk_level=p.risk_level,
            created_at=p.created_at
        ) for p in predictions
    ]

from fastapi import HTTPException

@router.get("/{assessment_id}", response_model=AssessmentHistoryResponse)
async def get_assessment(
    assessment_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Prediction).where(Prediction.id == assessment_id, Prediction.user_id == user.id)
    )
    prediction = result.scalars().first()
    if not prediction:
        raise HTTPException(status_code=404, detail="Assessment not found")
        
    return AssessmentHistoryResponse(
        id=prediction.id,
        input_data=prediction.input_data,
        prediction=prediction.prediction,
        probability=prediction.probability,
        risk_level=prediction.risk_level,
        created_at=prediction.created_at
    )
