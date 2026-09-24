from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import get_settings

settings = get_settings()

# Auto-convert sqlite:/// to sqlite+aiosqlite:/// for async support
_db_url = settings.DATABASE_URL
if _db_url.startswith("sqlite:///") and "aiosqlite" not in _db_url:
    _db_url = _db_url.replace("sqlite:///", "sqlite+aiosqlite:///", 1)

engine = create_async_engine(_db_url, echo=False)
SessionLocal = sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)
Base = declarative_base()

async def get_db():
    """Dependency that yields an async database session."""
    async with SessionLocal() as session:
        yield session

async def init_db():
    """Create all database tables."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
