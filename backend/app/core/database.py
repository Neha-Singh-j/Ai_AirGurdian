"""Async SQLAlchemy database session management."""

from collections.abc import AsyncGenerator
from pathlib import Path

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.pool import StaticPool

from app.core.config import get_settings

settings = get_settings()


def _ensure_sqlite_directory(url: str) -> None:
    """Create the parent directory for a file-based SQLite database."""
    if not url.startswith("sqlite"):
        return
    # sqlite+aiosqlite:///./data/airguardian.db -> ./data/airguardian.db
    db_path = url.split("///", 1)[-1]
    if db_path == ":memory:" or db_path.startswith(":memory:"):
        return
    Path(db_path).parent.mkdir(parents=True, exist_ok=True)


def _build_engine():
    url = settings.DATABASE_URL
    _ensure_sqlite_directory(url)

    engine_kwargs: dict = {"echo": False}

    if url.startswith("sqlite"):
        # SQLite works best with a single connection pool for async local dev.
        engine_kwargs["connect_args"] = {"check_same_thread": False}
        engine_kwargs["poolclass"] = StaticPool
    else:
        engine_kwargs["pool_pre_ping"] = True

    return create_async_engine(url, **engine_kwargs)


engine = _build_engine()
AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
