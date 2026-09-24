from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.api.routes import health, prediction, explainability, federated, models, privacy, insights, audit, organizations, users
from app.core.logging_config import get_logger
from app.core.database import init_db

logger = get_logger(__name__)
settings = get_settings()

app = FastAPI(title="HealthFusion_FL API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.CORS_ORIGINS.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    return response

@app.on_event("startup")
async def startup_event():
    logger.info(f"Starting {settings.APP_NAME} in {settings.APP_ENV} mode")
    await init_db()

app.include_router(health.router, prefix="/api")
app.include_router(users.router, prefix="/api/users")
app.include_router(organizations.router, prefix="/api/organizations")
app.include_router(prediction.router, prefix="/api/prediction")
app.include_router(explainability.router, prefix="/api/explainability")
app.include_router(federated.router, prefix="/api/federated")
app.include_router(models.router, prefix="/api/models")
app.include_router(privacy.router, prefix="/api/privacy")
app.include_router(insights.router, prefix="/api/insights")
app.include_router(audit.router, prefix="/api/audit")
