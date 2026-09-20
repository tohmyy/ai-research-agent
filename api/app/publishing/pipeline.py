"""Publish dispatch — the one choke point every trigger (Publish Now,
Retry, the scheduler's poll) goes through (BUILD-PLAN.md Phase 7).

Each call atomically claims its `publishing_queue` row before doing
anything else, which is what makes Cancel/Retry/the scheduler race-safe
against each other without any extra locking — see `dispatch_publish`.
"""
from __future__ import annotations

import uuid

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session_factory
from app.notifications.service import notify_publish_failed, notify_published
from app.pipeline.job_tracker import now
from app.publishing.config import get_channel_config
from app.publishing.publisher import (
    ChannelContent,
    EmailPublisher,
    LinkedInPublisher,
    Publisher,
    XPublisher,
)

PUBLISHERS: dict[str, Publisher] = {
    "linkedin": LinkedInPublisher(),
    "x": XPublisher(),
    "newsletter": EmailPublisher(),
}


async def _claim(session: AsyncSession, queue_id: uuid.UUID) -> bool:
    """Atomically flips a startable row to `publishing`. Returns False if
    another caller already claimed/cancelled/finished it — safe for
    Publish Now, Retry, and the scheduler to all call without conflict."""
    result = await session.execute(
        text(
            """
            UPDATE publishing_queue
            SET status = 'publishing', updated_at = :now
            WHERE id = :id AND status IN ('queued', 'scheduled', 'failed')
            RETURNING id
            """
        ),
        {"id": queue_id, "now": now()},
    )
    await session.commit()
    return result.first() is not None


async def _write_result(
    session: AsyncSession, queue_id: uuid.UUID, *, status: str, external_post_id: str | None, error: str | None
) -> None:
    await session.execute(
        text(
            """
            UPDATE publishing_queue
            SET status = :status, external_post_id = :external_post_id, error = :error,
                published_at = CASE WHEN :status = 'published' THEN :now ELSE published_at END,
                updated_at = :now
            WHERE id = :id
            """
        ),
        {
            "id": queue_id,
            "status": status,
            "external_post_id": external_post_id,
            "error": error,
            "now": now(),
        },
    )
    await session.commit()


async def _fail(session_factory, queue_uuid: uuid.UUID, recipient_id: str | None, channel: str | None, message: str) -> None:
    async with session_factory() as session:
        await _write_result(session, queue_uuid, status="failed", external_post_id=None, error=message)
        if recipient_id and channel:
            await notify_publish_failed(session, queue_uuid, recipient_id, channel, message)


async def dispatch_publish(queue_id: str) -> None:
    queue_uuid = uuid.UUID(queue_id)
    session_factory = get_session_factory()
    recipient_id: str | None = None
    channel: str | None = None

    async with session_factory() as session:
        if not await _claim(session, queue_uuid):
            return

    try:
        async with session_factory() as session:
            row = (
                await session.execute(
                    text(
                        """
                        SELECT pq.channel, pq.channel_content_id,
                               cc.status AS content_status, cc.subject, cc.body,
                               cr.created_by AS recipient_id
                        FROM publishing_queue pq
                        JOIN channel_content cc ON cc.id = pq.channel_content_id
                        JOIN article_drafts ad ON ad.id = cc.draft_id
                        JOIN content_requests cr ON cr.id = ad.request_id
                        WHERE pq.id = :id
                        """
                    ),
                    {"id": queue_uuid},
                )
            ).one()
            recipient_id, channel = row.recipient_id, row.channel

            if row.content_status != "approved":
                await _write_result(
                    session, queue_uuid, status="failed", external_post_id=None,
                    error="This content is no longer approved — it may have been edited or un-approved since it was queued.",
                )
                await notify_publish_failed(session, queue_uuid, row.recipient_id, row.channel, "content is no longer approved")
                return

            config = await get_channel_config(session, row.channel)
            if config is None:
                await _write_result(
                    session, queue_uuid, status="failed", external_post_id=None,
                    error=f"{row.channel} is not configured or is disabled — set it up in Settings.",
                )
                await notify_publish_failed(session, queue_uuid, row.recipient_id, row.channel, f"{row.channel} is not configured")
                return

        content = ChannelContent(id=str(row.channel_content_id), channel=row.channel, body=row.body, subject=row.subject)
        result = PUBLISHERS[row.channel].publish(content, config)

        async with session_factory() as session:
            if result.success:
                await _write_result(session, queue_uuid, status="published", external_post_id=result.external_post_id, error=None)
                await notify_published(session, queue_uuid, row.recipient_id, row.channel, result.external_post_id)
            else:
                await _write_result(session, queue_uuid, status="failed", external_post_id=None, error=result.error)
                await notify_publish_failed(session, queue_uuid, row.recipient_id, row.channel, result.error or "Unknown error")

    except Exception as exc:  # unexpected — still surface, never leave the row stuck
        await _fail(session_factory, queue_uuid, recipient_id, channel, f"Unexpected error: {exc}")
