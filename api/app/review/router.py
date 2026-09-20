"""Reviewer-triggered endpoints for a selected article (Phase 5)."""
from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db_session
from app.evaluation.evaluator import evaluate_draft
from app.evaluation.pipeline import copy_draft_sources, insert_evaluation
from app.evaluation.revision import revise_draft
from app.generation.claude_client import GenerationError
from app.generation.context import build_context_for_draft
from app.review.ai_assist import generate_ai_assist_edit

router = APIRouter(prefix="/drafts", tags=["review"])


async def _load_draft(session: AsyncSession, draft_id: uuid.UUID):
    row = (
        await session.execute(
            text(
                "SELECT id, request_id, version, variant_label, title, body_markdown, status "
                "FROM article_drafts WHERE id = :id"
            ),
            {"id": draft_id},
        )
    ).one_or_none()
    if row is None:
        raise HTTPException(status_code=404, detail="Draft not found")
    return row


class RequestRevisionRequest(BaseModel):
    note: str


class DraftResponse(BaseModel):
    id: str
    version: int
    title: str
    body_markdown: str


@router.post("/{draft_id}/request-revision", response_model=DraftResponse)
async def request_revision(
    draft_id: uuid.UUID,
    payload: RequestRevisionRequest,
    session: AsyncSession = Depends(get_db_session),
) -> DraftResponse:
    draft = await _load_draft(session, draft_id)
    context = await build_context_for_draft(session, draft_id)

    feedback = {
        "unsupported_claims": [],
        "sections_needing_revision": [],
        "recommended_changes": [payload.note],
    }
    try:
        new_article = revise_draft(draft.title, draft.body_markdown, feedback, context)
    except GenerationError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    new_id = (
        await session.execute(
            text(
                """
                INSERT INTO article_drafts (request_id, version, parent_draft_id, variant_label, title, body_markdown, status, revision_source)
                VALUES (:request_id, :version, :parent_draft_id, :variant_label, :title, :body_markdown, 'drafted', 'ai_revision')
                RETURNING id
                """
            ),
            {
                "request_id": draft.request_id,
                "version": draft.version + 1,
                "parent_draft_id": draft.id,
                "variant_label": draft.variant_label,
                "title": new_article["title"],
                "body_markdown": new_article["body_markdown"],
            },
        )
    ).scalar_one()
    await session.commit()

    await copy_draft_sources(session, draft.id, new_id)

    new_context = await build_context_for_draft(session, new_id)
    try:
        evaluation = evaluate_draft(new_article["title"], new_article["body_markdown"], new_context)
    except GenerationError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    await insert_evaluation(session, new_id, evaluation)

    # Carry forward the original draft's status (normally "selected", since
    # this only runs while a human is reviewing it) rather than resetting
    # it — the new version replaces it as "the current one under review."
    await session.execute(
        text("UPDATE article_drafts SET status = :status WHERE id = :id"),
        {"status": draft.status, "id": new_id},
    )
    await session.commit()

    return DraftResponse(
        id=str(new_id),
        version=draft.version + 1,
        title=new_article["title"],
        body_markdown=new_article["body_markdown"],
    )


class AiAssistRequest(BaseModel):
    instruction: str


class AiAssistResponse(BaseModel):
    title: str
    body_markdown: str


@router.post("/{draft_id}/ai-assist", response_model=AiAssistResponse)
async def ai_assist(
    draft_id: uuid.UUID,
    payload: AiAssistRequest,
    session: AsyncSession = Depends(get_db_session),
) -> AiAssistResponse:
    draft = await _load_draft(session, draft_id)
    context = await build_context_for_draft(session, draft_id)

    try:
        proposal = generate_ai_assist_edit(
            draft.title, draft.body_markdown, payload.instruction, context
        )
    except GenerationError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    return AiAssistResponse(title=proposal["title"], body_markdown=proposal["body_markdown"])
