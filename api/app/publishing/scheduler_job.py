"""The scheduler's poll job (BUILD-PLAN.md Phase 7).

Runs every 30s (see `main.py`'s `lifespan`): dispatches any `scheduled`
row whose time has come, and reaps anything stuck at `publishing` for more
than 5 minutes (a crash mid-dispatch) back to `failed` — otherwise
`publishing` is a dead-end no UI action can reach, since Retry only
targets `failed` rows.
"""
from __future__ import annotations

import logging
from datetime import timedelta

from sqlalchemy import text

from app.db.session import get_session_factory
from app.notifications.service import notify_publish_failed
from app.pipeline.job_tracker import now
from app.publishing.pipeline import dispatch_publish

logger = logging.getLogger(__name__)

STUCK_PUBLISHING_TIMEOUT = timedelta(minutes=5)


async def _reap_stuck_publishing() -> None:
    session_factory = get_session_factory()
    async with session_factory() as session:
        rows = (
            await session.execute(
                text(
                    """
                    UPDATE publishing_queue
                    SET status = 'failed',
                        error = 'Publish attempt did not complete within 5 minutes and may be stuck — verify on the target platform before retrying (a post may have already gone out).',
                        updated_at = :now
                    WHERE status = 'publishing' AND updated_at < :cutoff
                    RETURNING id, channel, (
                        SELECT cr.created_by FROM channel_content cc
                        JOIN article_drafts ad ON ad.id = cc.draft_id
                        JOIN content_requests cr ON cr.id = ad.request_id
                        WHERE cc.id = publishing_queue.channel_content_id
                    ) AS recipient_id
                    """
                ),
                {"now": now(), "cutoff": now() - STUCK_PUBLISHING_TIMEOUT},
            )
        ).all()
        await session.commit()

        for row in rows:
            await notify_publish_failed(
                session, row.id, row.recipient_id, row.channel,
                "publish attempt appears stuck and was marked failed after 5 minutes",
            )


async def poll_due_scheduled_items() -> None:
    session_factory = get_session_factory()
    async with session_factory() as session:
        due_ids = (
            await session.execute(
                text("SELECT id FROM publishing_queue WHERE status = 'scheduled' AND scheduled_at <= :now"),
                {"now": now()},
            )
        ).scalars().all()

    for queue_id in due_ids:
        try:
            await dispatch_publish(str(queue_id))
        except Exception:
            logger.exception("Unhandled error dispatching publishing_queue row %s", queue_id)

    await _reap_stuck_publishing()
