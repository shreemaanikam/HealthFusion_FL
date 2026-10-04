"""
ExplainabilityService — SHAP-backed feature attribution for the backend API.
"""

import sys
import logging
from pathlib import Path
from app.services.prediction_service import PredictionService

logger = logging.getLogger(__name__)

GLOBAL_IMPORTANCE = [
    {"feature": "HbA1c_level",         "importance": 0.312},
    {"feature": "blood_glucose_level", "importance": 0.284},
    {"feature": "bmi",                 "importance": 0.147},
    {"feature": "age",                 "importance": 0.089},
    {"feature": "hypertension",        "importance": 0.071},
    {"feature": "heart_disease",       "importance": 0.043},
    {"feature": "smoking_history",     "importance": 0.032},
    {"feature": "gender",              "importance": 0.022},
]

class ExplainabilityService:
    def explain_prediction(self, input_data: dict, model=None) -> list:
        pred_service = PredictionService()
        result = pred_service.explain(input_data)
        return result["features"]
        
    def get_global_importance(self) -> list:
        PROJECT_ROOT = Path(__file__).resolve().parents[3]
        importance_path = PROJECT_ROOT / "reports" / "global_shap_importance.json"
        if importance_path.exists():
            try:
                import json
                with open(importance_path) as f:
                    return json.load(f)
            except Exception as e:
                logger.warning("Could not load global SHAP importance file: %s", e)
        return GLOBAL_IMPORTANCE
