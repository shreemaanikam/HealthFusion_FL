"""
InsightService — rule-based clinical insight generation with optional
OpenRouter LLM augmentation.

Generates clinically grounded follow-up recommendations from prediction
context without invoking the LLM. If OpenRouter is configured, it
appends an AI-assisted plain-language summary.
"""

import datetime
import logging
from typing import Optional

logger = logging.getLogger(__name__)

# Clinical thresholds and follow-up rules (evidence-based, non-diagnostic)
_RISK_RULES = {
    "HbA1c_level": {
        "high":     (lambda v: v >= 6.5, "HbA1c ≥ 6.5% — consistent with diabetes diagnostic criteria"),
        "elevated": (lambda v: 5.7 <= v < 6.5, "HbA1c in pre-diabetic range (5.7–6.4%)"),
    },
    "blood_glucose_level": {
        "high":     (lambda v: v >= 200, "Fasting glucose ≥ 200 mg/dL"),
        "elevated": (lambda v: 126 <= v < 200, "Fasting glucose in impaired range (126–199 mg/dL)"),
    },
    "bmi": {
        "obese":      (lambda v: v >= 30, "BMI ≥ 30 (obesity class I+) — significant metabolic risk factor"),
        "overweight": (lambda v: 25 <= v < 30, "BMI 25–29.9 (overweight) — moderate risk factor"),
    },
    "hypertension": {
        "present": (lambda v: v > 0.5, "Hypertension — compounds cardiovascular-metabolic risk"),
    },
    "heart_disease": {
        "present": (lambda v: v > 0.5, "Existing heart disease — elevated overall cardiometabolic burden"),
    },
}

_FOLLOW_UP_BY_RISK = {
    "high": [
        "Confirm with a fasting plasma glucose or HbA1c test before initiating treatment.",
        "Consider referral to endocrinology for comprehensive diabetes management.",
        "Assess for microvascular complications (retinopathy, nephropathy, neuropathy).",
        "Evaluate cardiovascular risk profile and initiate risk reduction strategies.",
        "Provide diabetes self-management education resources.",
    ],
    "moderate": [
        "Schedule a confirmatory fasting plasma glucose or OGTT.",
        "Discuss lifestyle interventions: dietary modification, physical activity targets.",
        "Monitor weight and BMI trajectory over the next 3–6 months.",
        "Re-run the risk assessment after any significant change in glucose control.",
        "Assess for reversible risk factors (smoking, physical inactivity, diet).",
    ],
    "low": [
        "Continue routine metabolic screening per clinical guidelines.",
        "Counsel on preventive lifestyle strategies to maintain low-risk status.",
        "Re-assess annually or if new risk factors emerge.",
    ],
}


class InsightService:
    """
    Generate structured clinical insights from a prediction result.
    """

    def generate_insight(
        self,
        prediction: int,
        probability: float,
        feature_contributions: list,
        assessment_id: Optional[str] = None,
        model_version: str = "v1.0.0",
    ) -> dict:
        """
        Return a structured insight dict matching InsightResponse schema.

        Args:
            prediction: 0 or 1
            probability: float 0–1
            feature_contributions: list of {feature, impact, contribution, value}
            assessment_id: optional assessment identifier
            model_version: model version string

        Returns:
            dict with keys: risk_level, key_factors, follow_up_context,
            ai_explanation, model_version, timestamp, disclaimer
        """
        # Determine risk tier
        if probability >= 0.70:
            risk_level = "high"
        elif probability >= 0.30:
            risk_level = "moderate"
        else:
            risk_level = "low"

        # Build key factors from feature contributions and rule checks
        key_factors = self._extract_key_factors(feature_contributions)

        # Get evidence-based follow-up recommendations
        follow_up = _FOLLOW_UP_BY_RISK.get(risk_level, _FOLLOW_UP_BY_RISK["moderate"])

        return {
            "risk_level":       risk_level,
            "key_factors":      key_factors,
            "follow_up_context": follow_up,
            "ai_explanation":   None,   # populated by enhance_with_ai if configured
            "model_version":    model_version,
            "timestamp":        datetime.datetime.utcnow().isoformat(),
            "disclaimer":       "This is a model-predicted risk assessment, not a medical diagnosis.",
        }

    def _extract_key_factors(self, feature_contributions: list) -> list:
        """
        Derive plain-language key-factor strings from feature contributions.
        Returns up to 5 most impactful factors.
        """
        factors = []
        seen = set()

        # Sort by absolute contribution descending
        sorted_contribs = sorted(
            feature_contributions,
            key=lambda x: abs(x.get("contribution", 0)),
            reverse=True,
        )

        feature_labels = {
            "HbA1c_level":         "HbA1c level",
            "blood_glucose_level": "blood glucose",
            "bmi":                 "BMI",
            "age":                 "age",
            "hypertension":        "hypertension",
            "heart_disease":       "heart disease history",
            "smoking_history":     "smoking history",
            "gender":              "gender",
        }

        for contrib in sorted_contribs:
            feature = contrib.get("feature", "")
            impact = contrib.get("impact", "positive")
            value = contrib.get("value", 0)
            contribution = contrib.get("contribution", 0)

            if feature in seen or abs(contribution) < 0.001:
                continue
            seen.add(feature)

            label = feature_labels.get(feature, feature.replace("_", " "))
            direction = "elevated" if impact == "positive" else "reduced"

            # Apply clinical rules for specific features
            if feature == "HbA1c_level":
                if value >= 6.5:
                    factors.append(f"HbA1c {value:.1f}% — in diabetic diagnostic range (≥6.5%)")
                elif value >= 5.7:
                    factors.append(f"HbA1c {value:.1f}% — pre-diabetic range (5.7–6.4%)")
                else:
                    factors.append(f"HbA1c {value:.1f}% — {direction} contribution to risk score")
            elif feature == "blood_glucose_level":
                if value >= 200:
                    factors.append(f"Blood glucose {value:.0f} mg/dL — consistently elevated")
                elif value >= 126:
                    factors.append(f"Blood glucose {value:.0f} mg/dL — impaired fasting range")
                else:
                    factors.append(f"Blood glucose {value:.0f} mg/dL — {direction} risk contribution")
            elif feature == "bmi":
                if value >= 30:
                    factors.append(f"BMI {value:.1f} — obesity class I+ (significant metabolic risk)")
                elif value >= 25:
                    factors.append(f"BMI {value:.1f} — overweight range")
                else:
                    factors.append(f"BMI {value:.1f} — {direction} contribution")
            elif feature in ("hypertension", "heart_disease") and value > 0.5:
                factors.append(f"{label.capitalize()} — present, compounds metabolic risk")
            elif contribution != 0:
                factors.append(f"{label.capitalize()} — {direction} influence on prediction ({contribution:+.2f})")

            if len(factors) >= 5:
                break

        return factors if factors else ["No dominant risk factors identified from feature attribution."]

    async def enhance_with_ai(self, insight: dict, openrouter_service) -> dict:
        """
        Optionally call OpenRouter for a plain-language clinical summary.
        Modifies insight in-place, adding ai_explanation.
        Returns the updated insight.
        """
        if not openrouter_service or not openrouter_service.is_configured:
            return insight

        try:
            risk_level = insight.get("risk_level", "unknown")
            key_factors = insight.get("key_factors", [])
            probability = insight.get("probability", 0.0)

            prompt = (
                f"A patient has been assessed by a diabetes risk model. "
                f"The model-predicted risk level is '{risk_level}' "
                f"(probability: {probability:.1%}). "
                f"Key contributing factors: {'; '.join(key_factors[:3])}. "
                f"Write 2–3 plain-language sentences a clinician could share with the patient, "
                f"summarizing the risk assessment without making a diagnosis. "
                f"Use clear, reassuring language. Do not use technical jargon."
            )

            ai_text = await openrouter_service.generate_explanation(prompt, {})
            if ai_text:
                insight["ai_explanation"] = ai_text
        except Exception as e:
            logger.warning("OpenRouter AI enhancement failed: %s", e)

        return insight
