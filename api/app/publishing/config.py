"""Reads per-channel publishing credentials from `channel_configs`.

Credentials live in Postgres (set via the Next.js Settings page), not
FastAPI env vars — so disabling a channel or fixing a bad key there takes
effect on the very next publish attempt, with no server restart needed
(BUILD-PLAN.md Phase 7).
"""
from __future__ import annotations

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


async def get_channel_config(session: AsyncSession, channel: str) -> dict | None:
    """Returns the channel's config dict if it exists and is enabled, else None."""
    row = (
        await session.execute(
            text("SELECT enabled, config FROM channel_configs WHERE channel = :channel"),
            {"channel": channel},
        )
    ).one_or_none()
    if row is None or not row.enabled:
        return None
    return dict(row.config or {})
