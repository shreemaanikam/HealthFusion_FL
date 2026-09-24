import httpx
from app.config import get_settings

settings = get_settings()

class OpenRouterService:
    async def generate_explanation(self, prediction_context: dict) -> str:
        if not settings.OPENROUTER_API_KEY:
            return None
            
        try:
            async with httpx.AsyncClient() as client:
                headers = {"Authorization": f"Bearer {settings.OPENROUTER_API_KEY}"}
                payload = {
                    "model": settings.OPENROUTER_MODEL,
                    "messages": [{"role": "system", "content": "Explain prediction"}],
                }
                response = await client.post(f"{settings.OPENROUTER_BASE_URL}/chat/completions", json=payload, headers=headers)
                return response.json()["choices"][0]["message"]["content"]
        except Exception:
            return None
