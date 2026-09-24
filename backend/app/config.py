from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache
from typing import Optional

class Settings(BaseSettings):
    APP_NAME: str = "HealthFusion_FL"
    APP_ENV: str = "development"
    DEMO_MODE: bool = False
    DEBUG: bool = True
    SECRET_KEY: str = "supersecretkey"
    DATABASE_URL: str = "sqlite+aiosqlite:///./healthfusion.db"
    JWT_SECRET_KEY: str = "jwtsecretkey"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    OPENROUTER_API_KEY: Optional[str] = None
    OPENROUTER_MODEL: str = "openai/gpt-3.5-turbo"
    OPENROUTER_BASE_URL: str = "https://openrouter.ai/api/v1"
    
    FEDERATION_MODE: str = "simulation"
    FL_NUM_ROUNDS: int = 5
    FL_MIN_CLIENTS: int = 2
    
    DP_ENABLED: bool = False
    DP_EPSILON: float = 1.0
    
    BACKEND_HOST: str = "0.0.0.0"
    BACKEND_PORT: int = 8000
    CORS_ORIGINS: str = "*"
    LOG_LEVEL: str = "INFO"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

@lru_cache()
def get_settings():
    return Settings()
