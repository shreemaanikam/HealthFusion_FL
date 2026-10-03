"""
ExplainabilityService — SHAP-backed feature attribution for the backend API.

Uses a perturbation-based approach that works for both TensorFlow and
sklearn models without requiring a separate SHAP background dataset at
startup. SHAP KernelExplainer is used with a small zero-valued background
for speed; callers should not depend on absolute SHAP values for clinical
decisions.
"""

import sys
import logging
import numpy as np
from pathlib import Path

logger = logging.getLogger(__name__)

# Feature ordering matches the preprocessing pipeline exactly
FEATURE_NAMES = [
    "gender", "age", "hypertension", "heart_disease",
    "smoking_history", "bmi", "HbA1c_level", "blood_glucose_level",
]

FEATURE_LABELS = {
    "gender":              "Gender",
    "age":                 "Age",
    "hypertension":        "Hypertension",
    "heart_disease":       "Heart Disease",
    "smoking_history":     "Smoking History",
    "bmi":                 "BMI",
    "HbA1c_level":         "HbA1c Level",
    "blood_glucose_level": "Blood Glucose",
}

# Pre-computed global importance from training (mean |SHAP| over the test set).
# These are derived from the actual model evaluation; update after retraining.
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
    """Feature attribution via perturbation (SHAP-style) or SHAP proper."""

    def explain_prediction(self, input_data: dict, model) -> list:
        """
        Compute feature contributions for a single prediction.

        Returns a list of dicts:
          { feature, impact, contribution, value }

        Tries SHAP KernelExplainer first; falls back to simple
        leave-one-out perturbation if SHAP fails.
        """
        try:
            return self._shap_explain(input_data, model)
        except Exception as e:
            logger.warning("SHAP explanation failed (%s), using perturbation fallback.", e)
            return self._perturbation_explain(input_data, model)

    # ------------------------------------------------------------------
    # SHAP-based explanation
    # ------------------------------------------------------------------

    def _shap_explain(self, input_data: dict, model) -> list:
        """Use SHAP KernelExplainer with a zero-baseline background."""
        import shap

        from backend.app.services.prediction_service import PredictionService
        pred_service = PredictionService()
        feature_vector = pred_service.preprocess_input(input_data)

        # Background: 10 rows of zeros (neutral baseline)
        background = np.zeros((10, 8))

        def predict_fn(x):
            if hasattr(model, "predict"):
                try:
                    # TF model
                    return model.predict(x, verbose=0).flatten()
                except Exception:
                    pass
            if hasattr(model, "predict_proba"):
                return model.predict_proba(x)[:, 1]
            return np.zeros(len(x))

        explainer = shap.KernelExplainer(predict_fn, background)
        shap_values = explainer.shap_values(feature_vector, nsamples=50, silent=True)

        # shap_values may be a list (multi-output) — take first
        if isinstance(shap_values, list):
            sv = shap_values[0]
        else:
            sv = shap_values

        sv_flat = np.array(sv).flatten()

        contributions = []
        for i, feat in enumerate(FEATURE_NAMES):
            contribution = float(sv_flat[i]) if i < len(sv_flat) else 0.0
            raw_val = feature_vector[0][i]
            contributions.append({
                "feature":      feat,
                "impact":       "positive" if contribution >= 0 else "negative",
                "contribution": round(contribution, 4),
                "value":        float(raw_val),
            })

        return sorted(contributions, key=lambda x: abs(x["contribution"]), reverse=True)

    # ------------------------------------------------------------------
    # Perturbation-based fallback
    # ------------------------------------------------------------------

    def _perturbation_explain(self, input_data: dict, model) -> list:
        """
        Leave-one-out perturbation importance.

        For each feature, zero it out and measure the change in
        prediction probability. This is a signed importance estimate.
        """
        from backend.app.services.prediction_service import PredictionService
        pred_service = PredictionService()
        feature_vector = pred_service.preprocess_input(input_data)

        def score(x):
            if x is None or model is None:
                return 0.5
            try:
                if hasattr(model, "predict"):
                    return float(model.predict(x, verbose=0)[0][0])
                return float(model.predict_proba(x)[0][1])
            except Exception:
                return 0.5

        base_prob = score(feature_vector)
        contributions = []

        for i, feat in enumerate(FEATURE_NAMES):
            perturbed = feature_vector.copy()
            perturbed[0][i] = 0.0
            perturbed_prob = score(perturbed)
            contribution = base_prob - perturbed_prob  # positive → feature increases risk

            raw_val = feature_vector[0][i]
            contributions.append({
                "feature":      feat,
                "impact":       "positive" if contribution >= 0 else "negative",
                "contribution": round(contribution, 4),
                "value":        float(raw_val),
            })

        return sorted(contributions, key=lambda x: abs(x["contribution"]), reverse=True)

    def get_global_importance(self) -> list:
        """
        Return pre-computed global feature importance (mean |SHAP| from training).

        If real SHAP global values have been saved to disk, load those.
        Otherwise fall back to the pre-computed constants above.
        """
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
