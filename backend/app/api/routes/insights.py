from fastapi import APIRouter
from typing import Optional, List
from pydantic import BaseModel
from app.schemas.schemas import InsightResponse, ReportResponse, FeatureContribution
from app.services.insight_service import InsightService
import datetime

router = APIRouter(tags=["Insights"])


class InsightsGenerateRequest(BaseModel):
    """
    Request body for POST /api/insights/generate.
    Accepts full prediction context since no persistent assessment store exists.
    """
    assessment_id: Optional[str] = None
    risk_level: str = "moderate"
    probability: float = 0.5
    model_version: str = "v1.0.0"
    feature_contributions: Optional[List[FeatureContribution]] = None


class InsightsReportRequest(InsightsGenerateRequest):
    """Same payload as generate; report includes the full structured output."""
    pass


_insight_service = InsightService()


@router.post("/generate", response_model=InsightResponse)
async def generate(payload: InsightsGenerateRequest):
    """
    POST /api/insights/generate

    Generate structured clinical insights from a prediction result.
    Uses rule-based logic plus optional OpenRouter LLM augmentation.
    """
    contributions_raw = []
    if payload.feature_contributions:
        for fc in payload.feature_contributions:
            contributions_raw.append({
                "feature":      fc.feature,
                "impact":       fc.impact,
                "contribution": fc.contribution,
                "value":        fc.value,
            })

    prediction_int = 1 if payload.probability >= 0.5 else 0

    insight = _insight_service.generate_insight(
        prediction=prediction_int,
        probability=payload.probability,
        feature_contributions=contributions_raw,
        assessment_id=payload.assessment_id,
        model_version=payload.model_version,
    )

    # Try OpenRouter augmentation (non-blocking fallback)
    try:
        from app.services.openrouter_service import OpenRouterService
        openrouter = OpenRouterService()
        insight["probability"] = payload.probability
        insight = await _insight_service.enhance_with_ai(insight, openrouter)
    except Exception:
        pass  # OpenRouter unavailable — deterministic insight is sufficient

    return InsightResponse(
        risk_level=insight["risk_level"],
        key_factors=insight["key_factors"],
        follow_up_context=insight["follow_up_context"],
        ai_explanation=insight.get("ai_explanation"),
        model_version=insight["model_version"],
        timestamp=insight["timestamp"],
        disclaimer=insight["disclaimer"],
    )


@router.post("/report", response_model=ReportResponse)
async def report(payload: InsightsReportRequest):
    """
    POST /api/insights/report

    Generate a complete structured report from a prediction result.
    """
    contributions_raw = []
    if payload.feature_contributions:
        for fc in payload.feature_contributions:
            contributions_raw.append({
                "feature":      fc.feature,
                "impact":       fc.impact,
                "contribution": fc.contribution,
                "value":        fc.value,
            })

    prediction_int = 1 if payload.probability >= 0.5 else 0

    insight = _insight_service.generate_insight(
        prediction=prediction_int,
        probability=payload.probability,
        feature_contributions=contributions_raw,
        assessment_id=payload.assessment_id,
        model_version=payload.model_version,
    )

    insight_response = InsightResponse(
        risk_level=insight["risk_level"],
        key_factors=insight["key_factors"],
        follow_up_context=insight["follow_up_context"],
        ai_explanation=insight.get("ai_explanation"),
        model_version=insight["model_version"],
        timestamp=insight["timestamp"],
        disclaimer=insight["disclaimer"],
    )

    return ReportResponse(
        assessment_id=payload.assessment_id or f"ax-{int(datetime.datetime.utcnow().timestamp())}",
        model_version=payload.model_version,
        prediction=prediction_int,
        probability=payload.probability,
        risk_level=insight["risk_level"],
        feature_contributions=payload.feature_contributions or [],
        insight=insight_response,
        timestamp=insight["timestamp"],
        disclaimer=insight["disclaimer"],
    )
