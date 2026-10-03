"""
Database engine and session configuration for HealthFusion_FL.

Supports:
- SQLite + aiosqlite (development / SQLite-based deployments)
- PostgreSQL + asyncpg (production on Render/Railway)

The DATABASE_URL environment variable controls which backend is used:

  SQLite (development):
    sqlite:///./healthfusion.db
    sqlite+aiosqlite:///./healthfusion.db

  PostgreSQL (production):
    postgresql://user:pass@host/db
    postgresql+asyncpg://user:pass@host/db
    postgres://user:pass@host/db   ← Render uses this prefix
"""

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.pool import NullPool
from app.config import get_settings

settings = get_settings()


def _make_async_url(url: str) -> str:
    """
    Normalise a database URL for async SQLAlchemy:
    - sqlite:///  → sqlite+aiosqlite:///
    - postgres:// → postgresql+asyncpg://   (Render's default prefix)
    - postgresql:// → postgresql+asyncpg://
    - Already-async URLs are passed through unchanged.
    """
    if url.startswith("sqlite:///") and "aiosqlite" not in url:
        return url.replace("sqlite:///", "sqlite+aiosqlite:///", 1)
    if url.startswith("postgres://"):
        # Render provides postgres:// — SQLAlchemy needs postgresql+asyncpg://
        return url.replace("postgres://", "postgresql+asyncpg://", 1)
    if url.startswith("postgresql://") and "asyncpg" not in url:
        return url.replace("postgresql://", "postgresql+asyncpg://", 1)
    return url


_db_url = _make_async_url(settings.DATABASE_URL)

# Use NullPool for serverless/ephemeral deployments (Render free tier spins down).
# SQLite doesn't benefit from pooling anyway; PostgreSQL handles its own pooling.
_is_sqlite = "sqlite" in _db_url
_engine_kwargs = {
    "echo": settings.DEBUG,
}
if not _is_sqlite:
    # PostgreSQL on Render free tier: keep connections conservative
    _engine_kwargs["pool_size"] = 5
    _engine_kwargs["max_overflow"] = 10
    _engine_kwargs["pool_pre_ping"] = True

engine = create_async_engine(_db_url, **_engine_kwargs)
SessionLocal = sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)
Base = declarative_base()


async def get_db():
    """Dependency that yields an async database session."""
    async with SessionLocal() as session:
        yield session


async def init_db():
    """
    Create all database tables if they don't exist.

    This is called at application startup via FastAPI's @app.on_event("startup").
    For production schema migrations, use Alembic (`alembic upgrade head`).
    """
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
