"""Sends SendGrid emails on the three triggers TDD.md §9 defines, logging
every send attempt — success or failure — to `notifications`. A failed
send is recorded, never raised, so it can't take down the pipeline stage
reporting it, and a missing notification is itself debuggable rather than
a silent gap.
"""
from __future__ import annotations

import uuid

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.emailing import send_email
from app.pipeline.job_tracker import now


async def _send_and_log(
    session: AsyncSession,
    *,
    recipient_id: str,
    recipient_email: str,
    notification_type: str,
    target_id: uuid.UUID | None,
    subject: str,
    body: str,
) -> None:
    settings = get_settings()
    sent_at: object = None
    error: str | None = None

    if not settings.EMAIL_API_KEY or not settings.EMAIL_FROM_ADDRESS:
        error = "EMAIL_API_KEY or EMAIL_FROM_ADDRESS is not configured."
    else:
        success, _message_id, send_error = send_email(
            provider=settings.EMAIL_PROVIDER,
            api_key=settings.EMAIL_API_KEY,
            from_email=settings.EMAIL_FROM_ADDRESS,
            to_emails=[recipient_email],
            subject=subject,
            html_content=body,
        )
        if success:
            sent_at = now()
        else:
            error = send_error

    await session.execute(
        text(
            """
            INSERT INTO notifications (recipient_id, type, target_id, sent_at, error)
            VALUES (:recipient_id, :type, :target_id, :sent_at, :error)
            """
        ),
        {
            "recipient_id": recipient_id,
            "type": notification_type,
            "target_id": target_id,
            "sent_at": sent_at,
            "error": error,
        },
    )
    await session.commit()


async def _load_recipient(session: AsyncSession, recipient_id: str):
    return (
        await session.execute(
            text('SELECT email FROM "user" WHERE id = :id'),
            {"id": recipient_id},
        )
    ).one_or_none()


async def notify_review_ready(session: AsyncSession, request_id: uuid.UUID) -> None:
    row = (
        await session.execute(
            text(
                """
                SELECT cr.created_by, u.email, cr.raw_idea
                FROM content_requests cr
                JOIN "user" u ON u.id = cr.created_by
                WHERE cr.id = :id
                """
            ),
            {"id": request_id},
        )
    ).one_or_none()
    if row is None:
        return

    settings = get_settings()
    link = f"{settings.APP_BASE_URL}/content-requests/{request_id}"
    await _send_and_log(
        session,
        recipient_id=row.created_by,
        recipient_email=row.email,
        notification_type="review_ready",
        target_id=request_id,
        subject="Content ready for review",
        body=f'"{row.raw_idea}" is ready for your review. <a href="{link}">Review it here</a>.',
    )


async def notify_published(
    session: AsyncSession,
    queue_id: uuid.UUID,
    recipient_id: str,
    channel: str,
    external_post_id: str | None,
) -> None:
    recipient = await _load_recipient(session, recipient_id)
    if recipient is None:
        return

    await _send_and_log(
        session,
        recipient_id=recipient_id,
        recipient_email=recipient.email,
        notification_type="published",
        target_id=queue_id,
        subject=f"Your {channel} content has been published",
        body=f"Your {channel} content was published successfully."
        + (f" Reference: {external_post_id}" if external_post_id else ""),
    )


async def notify_publish_failed(
    session: AsyncSession,
    queue_id: uuid.UUID,
    recipient_id: str,
    channel: str,
    error: str,
) -> None:
    recipient = await _load_recipient(session, recipient_id)
    if recipient is None:
        return

    settings = get_settings()
    link = f"{settings.APP_BASE_URL}/publishing"
    await _send_and_log(
        session,
        recipient_id=recipient_id,
        recipient_email=recipient.email,
        notification_type="publish_failed",
        target_id=queue_id,
        subject=f"Publishing to {channel} failed",
        body=f'Publishing your {channel} content failed: {error}. <a href="{link}">Retry from the Publishing queue</a>.',
    )
