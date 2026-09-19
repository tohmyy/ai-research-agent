"""Reviewer-triggered endpoints for adapted channel content (Phase 6)."""
from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.channels.evaluation import evaluate_channel_content
from app.channels.revision import revise_channel_content
from app.db.session import get_db_session
from app.evaluation.pipeline import insert_evaluation_for_channel_content
from app.generation.context import build_context_for_draft

router = APIRouter(prefix="/channel-content", tags=["channels"])


async def _load_channel_content(session: AsyncSession, content_id: uuid.UUID):
    row = (
        await session.execute(
            text(
                "SELECT id, draft_id, channel, version, subject, body, status "
                "FROM channel_content WHERE id = :id"
            ),
            {"id": content_id},
        )
    ).one_or_none()
    if row is None:
        raise HTTPException(status_code=404, detail="Channel content not found")
    return row


class RequestRevisionRequest(BaseModel):
    note: str


class ChannelContentResponse(BaseModel):
    id: str
    version: int
    subject: str | None
    body: str


@router.post("/{content_id}/request-revision", response_model=ChannelContentResponse)
async def request_revision(
    content_id: uuid.UUID,
    payload: RequestRevisionRequest,
    session: AsyncSession = Depends(get_db_session),
) -> ChannelContentResponse:
    content = await _load_channel_content(session, content_id)
    context = await build_context_for_draft(session, content.draft_id)

    feedback = {
        "unsupported_claims": [],
        "sections_needing_revision": [],
        "recommended_changes": [payload.note],
    }
    revised = revise_channel_content(content.channel, content.subject, content.body, feedback, context)

    new_id = (
        await session.execute(
            text(
                """
                INSERT INTO channel_content (draft_id, channel, version, parent_content_id, revision_source, subject, body, status)
                VALUES (:draft_id, :channel, :version, :parent_content_id, 'ai_revision', :subject, :body, 'drafted')
                RETURNING id
                """
            ),
            {
                "draft_id": content.draft_id,
                "channel": content.channel,
                "version": content.version + 1,
                "parent_content_id": content.id,
                "subject": revised.get("subject"),
                "body": revised["body"],
            },
        )
    ).scalar_one()
    await session.commit()

    evaluation = evaluate_channel_content(content.channel, revised.get("subject"), revised["body"], context)
    await insert_evaluation_for_channel_content(session, new_id, evaluation)

    # Carry forward the original content's status (normally "evaluated",
    # since this only runs while a human is reviewing it) rather than
    # resetting it — the new version replaces it as the current one.
    await session.execute(
        text("UPDATE channel_content SET status = :status WHERE id = :id"),
        {"status": content.status, "id": new_id},
    )
    await session.commit()

    return ChannelContentResponse(
        id=str(new_id),
        version=content.version + 1,
        subject=revised.get("subject"),
        body=revised["body"],
    )
