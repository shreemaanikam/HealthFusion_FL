"""
Application configuration loaded from environment variables.

All secrets MUST be set via .env file or environment variables.
Default values for secrets are intentionally non-functional to prevent
accidental use in production. See .env.example for the full template.
"""

from functools import lru_cache
from typing import Optional

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings — loaded from .env file."""

    # ----- Application -----
    APP_NAME: str = "HealthFusion_FL"
    APP_ENV: str = "development"
    DEMO_MODE: bool = True
    DEBUG: bool = True

    # ----- Secrets (MUST be overridden in .env) -----
    SECRET_KEY: str = "change-me-to-a-random-secret-key"
    JWT_SECRET_KEY: str = "change-me-to-a-random-jwt-secret"

    # ----- Database -----
    DATABASE_URL: str = "sqlite+aiosqlite:///./healthfusion.db"

    # ----- Authentication -----
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # ----- OpenRouter (optional) -----
    OPENROUTER_API_KEY: Optional[str] = None
    OPENROUTER_MODEL: str = "qwen/qwen3.8-27b:free"
    OPENROUTER_BASE_URL: str = "https://openrouter.ai/api/v1"
    
    # ----- Google Auth -----
    GOOGLE_CLIENT_ID: Optional[str] = None

    # ----- Federated Learning -----
    FEDERATION_MODE: str = "iid"
    FL_NUM_ROUNDS: int = 5
    FL_MIN_CLIENTS: int = 3
    FL_SERVER_ADDRESS: str = "0.0.0.0:8080"

    # ----- Privacy -----
    DP_ENABLED: bool = False
    DP_EPSILON: float = 1.0
    DP_DELTA: float = 1e-5

    # ----- Server -----
    BACKEND_HOST: str = "0.0.0.0"
    BACKEND_PORT: int = 8000
    # Comma-separated list. Development default only; set explicitly in production.
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:3001,http://localhost:5173"
    LOG_LEVEL: str = "INFO"

    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )


@lru_cache()
def get_settings() -> Settings:
    """Singleton settings loader."""
    return Settings()
