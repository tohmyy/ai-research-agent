"""Application configuration.

Reads every third-party and database credential FastAPI needs from
environment variables (see TDD.md §12 for the authoritative list). All
fields default to an empty string so the service can boot in Phase 0 without
any real secrets configured — later phases can add per-integration
validation as each one comes online.
"""
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Environment-driven settings for the FastAPI AI engine."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Claude API — planning, drafting, evaluation, revision, channel adaptation.
    ANTHROPIC_API_KEY: str = ""

    # Firecrawl — search + scrape (research stage).
    FIRECRAWL_API_KEY: str = ""

    # Voyage AI — embeddings (RAG stage).
    VOYAGE_API_KEY: str = ""

    # Supabase — shared Postgres + pgvector, used by both services.
    SUPABASE_URL: str = ""
    SUPABASE_SERVICE_KEY: str = ""

    # Shared Postgres connection string, asyncpg driver
    # (e.g. postgresql+asyncpg://user:password@host:5432/postgres).
    DATABASE_URL: str = ""

    # LinkedIn publishing (w_member_social scope).
    LINKEDIN_ACCESS_TOKEN: str = ""

    # X (Twitter) publishing.
    X_API_KEY: str = ""
    X_API_SECRET: str = ""
    X_ACCESS_TOKEN: str = ""

    # SendGrid — newsletter sends + notifications.
    SENDGRID_API_KEY: str = ""


@lru_cache
def get_settings() -> Settings:
    """Return a cached `Settings` instance.

    Cached so later phases can call `get_settings()` freely (e.g. as a
    FastAPI dependency) without re-reading the environment on every call.
    """
    return Settings()
