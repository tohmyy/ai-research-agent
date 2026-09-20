"""Publishing endpoints (BUILD-PLAN.md Phase 7).

One endpoint per action, matching every other router in this codebase.
Publish Now and Schedule both re-verify the approval gate server-side
(TDD.md: "This rule must also be enforced by the backend") rather than
trusting Next.js's own check. Retry's re-check happens inside
`dispatch_publish` itself, since that's the single choke point every
trigger shares.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from pydantic import BaseModel, field_validator
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db_session
from app.pipeline.job_tracker import now
from app.publishing.pipeline import dispatch_publish

router = APIRouter(prefix="/publishing", tags=["publishing"])


class ScheduleRequest(BaseModel):
    scheduled_at: datetime

    @field_validator("scheduled_at")
    @classmethod
    def _to_naive_utc(cls, value: datetime) -> datetime:
        # The DB's timestamp columns are naive UTC (see job_tracker.now()) —
        # normalize whatever offset the client sent (typically a "Z"-suffixed
        # ISO string, parsed as timezone-aware) to match, so it can be
        # compared against and stored alongside `now()` without error.
        if value.tzinfo is not None:
            return value.astimezone(timezone.utc).replace(tzinfo=None)
        return value


class QueueItemResponse(BaseModel):
    id: str
    channel_content_id: str
    channel: str
    status: str
    scheduled_at: datetime | None
    published_at: datetime | None
    external_post_id: str | None
    error: str | None


async def _load_approved_channel_content(session: AsyncSession, content_id: uuid.UUID):
    row = (
        await session.execute(
            text("SELECT id, channel, status FROM channel_content WHERE id = :id"),
            {"id": content_id},
        )
    ).one_or_none()
    if row is None:
        raise HTTPException(status_code=404, detail="Channel content not found")
    if row.status != "approved":
        raise HTTPException(status_code=409, detail="Content must be approved before it can be published")
    return row


def _to_response(row) -> QueueItemResponse:
    return QueueItemResponse(
        id=str(row.id),
        channel_content_id=str(row.channel_content_id),
        channel=row.channel,
        status=row.status,
        scheduled_at=row.scheduled_at,
        published_at=row.published_at,
        external_post_id=row.external_post_id,
        error=row.error,
    )


@router.post("/{content_id}/publish-now", response_model=QueueItemResponse)
async def publish_now(
    content_id: uuid.UUID,
    background_tasks: BackgroundTasks,
    session: AsyncSession = Depends(get_db_session),
) -> QueueItemResponse:
    content = await _load_approved_channel_content(session, content_id)

    row = (
        await session.execute(
            text(
                """
                INSERT INTO publishing_queue (channel_content_id, channel, status)
                VALUES (:content_id, :channel, 'queued')
                RETURNING *
                """
            ),
            {"content_id": content.id, "channel": content.channel},
        )
    ).one()
    await session.commit()

    background_tasks.add_task(dispatch_publish, str(row.id))
    return _to_response(row)


@router.post("/{content_id}/schedule", response_model=QueueItemResponse)
async def schedule(
    content_id: uuid.UUID,
    payload: ScheduleRequest,
    session: AsyncSession = Depends(get_db_session),
) -> QueueItemResponse:
    content = await _load_approved_channel_content(session, content_id)
    if payload.scheduled_at <= now():
        raise HTTPException(status_code=400, detail="scheduled_at must be in the future")

    row = (
        await session.execute(
            text(
                """
                INSERT INTO publishing_queue (channel_content_id, channel, status, scheduled_at)
                VALUES (:content_id, :channel, 'scheduled', :scheduled_at)
                RETURNING *
                """
            ),
            {"content_id": content.id, "channel": content.channel, "scheduled_at": payload.scheduled_at},
        )
    ).one()
    await session.commit()
    return _to_response(row)


@router.post("/queue/{queue_id}/retry", response_model=QueueItemResponse)
async def retry(
    queue_id: uuid.UUID,
    background_tasks: BackgroundTasks,
    session: AsyncSession = Depends(get_db_session),
) -> QueueItemResponse:
    row = (
        await session.execute(text("SELECT * FROM publishing_queue WHERE id = :id"), {"id": queue_id})
    ).one_or_none()
    if row is None:
        raise HTTPException(status_code=404, detail="Queue item not found")
    if row.status != "failed":
        raise HTTPException(status_code=409, detail="Only a failed item can be retried")

    background_tasks.add_task(dispatch_publish, str(queue_id))
    return _to_response(row)


@router.patch("/queue/{queue_id}/schedule", response_model=QueueItemResponse)
async def edit_schedule(
    queue_id: uuid.UUID,
    payload: ScheduleRequest,
    session: AsyncSession = Depends(get_db_session),
) -> QueueItemResponse:
    if payload.scheduled_at <= now():
        raise HTTPException(status_code=400, detail="scheduled_at must be in the future")

    row = (
        await session.execute(
            text(
                """
                UPDATE publishing_queue
                SET scheduled_at = :scheduled_at, updated_at = :now
                WHERE id = :id AND status = 'scheduled'
                RETURNING *
                """
            ),
            {"id": queue_id, "scheduled_at": payload.scheduled_at, "now": now()},
        )
    ).one_or_none()
    await session.commit()
    if row is None:
        raise HTTPException(status_code=409, detail="This item is no longer scheduled and can't be rescheduled")
    return _to_response(row)


@router.post("/queue/{queue_id}/cancel", response_model=QueueItemResponse)
async def cancel(
    queue_id: uuid.UUID,
    session: AsyncSession = Depends(get_db_session),
) -> QueueItemResponse:
    row = (
        await session.execute(
            text(
                """
                UPDATE publishing_queue
                SET status = 'cancelled', updated_at = :now
                WHERE id = :id AND status = 'scheduled'
                RETURNING *
                """
            ),
            {"id": queue_id, "now": now()},
        )
    ).one_or_none()
    await session.commit()
    if row is None:
        raise HTTPException(
            status_code=409,
            detail="This item is no longer scheduled and can't be cancelled (it may already be publishing)",
        )
    return _to_response(row)
