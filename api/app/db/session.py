"""Async SQLAlchemy engine and session factory for the shared Postgres database.

Reads `DATABASE_URL` from `app.config.Settings` (asyncpg driver, e.g.
`postgresql+asyncpg://user:password@host:5432/postgres`). Both the engine
and the session factory are built lazily and cached, so importing this
module never opens a connection and never fails just because `DATABASE_URL`
is unset — required for the service to boot in Phase 0.

No ORM models live here yet (see `app/db/__init__.py`); later phases will
use `get_db_session` as a FastAPI dependency to read/write the tables in
TDD.md §3.
"""
from collections.abc import AsyncGenerator
from functools import lru_cache

from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.config import get_settings

# Used only when DATABASE_URL is unset, so the engine can still be
# constructed (though never successfully connected to) in Phase 0.
_FALLBACK_DATABASE_URL = "postgresql+asyncpg://localhost/postgres"


@lru_cache
def get_engine() -> AsyncEngine:
    """Return the (lazily created, cached) async engine bound to DATABASE_URL."""
    settings = get_settings()
    database_url = settings.DATABASE_URL or _FALLBACK_DATABASE_URL
    return create_async_engine(database_url, echo=False, future=True)


@lru_cache
def get_session_factory() -> async_sessionmaker[AsyncSession]:
    """Return the (lazily created, cached) async session factory."""
    return async_sessionmaker(bind=get_engine(), class_=AsyncSession, expire_on_commit=False)


async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency that yields an async SQLAlchemy session per request.

    Usage (once routes exist): `session: AsyncSession = Depends(get_db_session)`.
    """
    session_factory = get_session_factory()
    async with session_factory() as session:
        yield session
