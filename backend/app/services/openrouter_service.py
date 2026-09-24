"""
OpenRouter AI integration service for HealthFusion_FL.

Provides optional LLM-powered explanation enhancement for predictions.
OpenRouter is NEVER used for diagnosis — it only explains/summarizes
the ML model's prediction in plain language.

If the API key is missing or the service is unavailable, the application
falls back to deterministic structured explanations.
"""

import logging
from typing import Optional

import httpx

from app.config import get_settings

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are a clinical decision support assistant.
You are given a machine learning model's risk prediction for diabetes.
Your role is to explain the prediction in plain, patient-friendly language.

RULES:
- You are NOT diagnosing the patient.
- You are explaining what the model predicted and which features contributed.
- Use the phrase "model-predicted risk" — never say "diagnosis".
- Be factual, clear, and empathetic.
- Keep the explanation under 200 words.
- Mention the top contributing features and what they mean clinically.
- End with a reminder that this is a screening tool, not a clinical diagnosis.
"""


class OpenRouterService:
    """Service for generating AI-enhanced explanations via OpenRouter."""

    def __init__(self) -> None:
        self._settings = get_settings()

    @property
    def is_configured(self) -> bool:
        """Check if the OpenRouter API key is configured (without exposing it)."""
        return bool(self._settings.OPENROUTER_API_KEY)

    async def generate_explanation(
        self, prediction_context: dict
    ) -> Optional[str]:
        """
        Generate an AI explanation for a prediction.

        Args:
            prediction_context: Dict with prediction, probability, risk_level,
                                and feature_contributions.

        Returns:
            Explanation string, or None if unavailable.
        """
        if not self.is_configured:
            logger.info("OpenRouter not configured — skipping AI explanation")
            return None

        user_message = self._build_user_prompt(prediction_context)

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self._settings.OPENROUTER_BASE_URL}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self._settings.OPENROUTER_API_KEY}",
                        "Content-Type": "application/json",
                        "HTTP-Referer": "https://github.com/shreemaanikam/HealthFusion_FL",
                        "X-Title": "HealthFusion_FL",
                    },
                    json={
                        "model": self._settings.OPENROUTER_MODEL,
                        "messages": [
                            {"role": "system", "content": SYSTEM_PROMPT},
                            {"role": "user", "content": user_message},
                        ],
                        "max_tokens": 500,
                        "temperature": 0.3,
                    },
                )
                response.raise_for_status()

                data = response.json()
                explanation = data["choices"][0]["message"]["content"]

                # Log success without exposing secrets
                model_used = data.get("model", "unknown")
                logger.info(
                    "OpenRouter explanation generated (model=%s, tokens=%s)",
                    model_used,
                    data.get("usage", {}).get("total_tokens", "?"),
                )

                return explanation

        except httpx.HTTPStatusError as e:
            logger.warning(
                "OpenRouter HTTP error: status=%d", e.response.status_code
            )
            return None
        except httpx.RequestError as e:
            logger.warning("OpenRouter request error: %s", type(e).__name__)
            return None
        except (KeyError, IndexError) as e:
            logger.warning("OpenRouter response parsing error: %s", e)
            return None
        except Exception:
            logger.exception("Unexpected OpenRouter error")
            return None

    async def check_connectivity(self) -> dict:
        """
        Test OpenRouter API connectivity without exposing secrets.

        Returns:
            Dict with status information (no secrets).
        """
        if not self.is_configured:
            return {"configured": False, "status": "not_configured"}

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    "https://openrouter.ai/api/v1/models",
                    headers={
                        "Authorization": f"Bearer {self._settings.OPENROUTER_API_KEY}",
                    },
                )
                return {
                    "configured": True,
                    "status": "connected" if response.status_code == 200 else "error",
                    "http_status": response.status_code,
                    "model_configured": self._settings.OPENROUTER_MODEL,
                }
        except Exception as e:
            return {
                "configured": True,
                "status": "unreachable",
                "error": type(e).__name__,
            }

    @staticmethod
    def _build_user_prompt(ctx: dict) -> str:
        """Build the user prompt from prediction context."""
        parts = [
            f"Prediction: {'Positive (diabetes risk detected)' if ctx.get('prediction') == 1 else 'Negative (low risk)'}",
            f"Probability: {ctx.get('probability', 'N/A')}",
            f"Risk level: {ctx.get('risk_level', 'N/A')}",
        ]

        contributions = ctx.get("feature_contributions", [])
        if contributions:
            parts.append("\nTop contributing features:")
            for fc in contributions[:5]:
                parts.append(
                    f"  - {fc.get('feature', '?')}: value={fc.get('value', '?')}, "
                    f"impact={fc.get('impact', '?')}, contribution={fc.get('contribution', '?')}"
                )

        parts.append(
            "\nPlease explain this model-predicted risk assessment to the patient."
        )
        return "\n".join(parts)
