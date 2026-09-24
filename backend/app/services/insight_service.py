from app.schemas.schemas import InsightResponse

class InsightService:
    def generate_insight(self, prediction: int, probability: float, feature_contributions: list) -> InsightResponse:
        risk_level = "low"
        if probability >= 0.7: risk_level = "high"
        elif probability >= 0.3: risk_level = "moderate"
        
        return InsightResponse(
            risk_level=risk_level,
            key_factors=["High age", "Elevated BMI"],
            follow_up_context=["Recommend lifestyle modifications"],
            model_version="v1.0.0",
            timestamp="2023-10-01T12:00:00Z"
        )
        
    def enhance_with_ai(self, insight: InsightResponse, openrouter_service):
        pass
