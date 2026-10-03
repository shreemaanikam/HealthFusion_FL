from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.config import get_settings
from app.api.routes import health, prediction, explainability, federated, models, privacy, insights, audit, organizations, users
from app.core.logging_config import get_logger
from app.core.database import init_db

logger = get_logger(__name__)
settings = get_settings()

_IS_PROD = settings.APP_ENV.lower() == "production"
_DEFAULT_SECRETS = {"change-me-to-a-random-jwt-secret", "change-me-to-a-random-secret-key", ""}

# Never start a production server with a placeholder JWT secret.
if _IS_PROD and settings.JWT_SECRET_KEY in _DEFAULT_SECRETS:
    raise RuntimeError(
        "JWT_SECRET_KEY is unset or a placeholder. Set a strong random value in the server environment."
    )

app = FastAPI(
    title="HealthFusion_FL API",
    version="1.0.0",
    # Interactive docs are useful in development; hide them from the public in production.
    docs_url=None if _IS_PROD else "/docs",
    redoc_url=None if _IS_PROD else "/redoc",
    openapi_url=None if _IS_PROD else "/openapi.json",
)

_cors_origins = [o.strip() for o in settings.CORS_ORIGINS.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
)


@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    if _IS_PROD:
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response


# ---- Safe error handling: detailed errors go to server logs only ----

@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    # Return field locations/messages only — never echo the submitted input back.
    errors = [{"loc": list(e.get("loc", [])), "msg": e.get("msg", "invalid")} for e in exc.errors()]
    return JSONResponse(status_code=422, content={"detail": errors})


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled error on %s %s", request.method, request.url.path)
    return JSONResponse(status_code=500, content={"detail": "Internal server error."})


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
