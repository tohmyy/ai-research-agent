"""Channel adaptation pipeline.

Runs after article approval (Phase 5), sharing one `research_jobs`
row/`JobTracker` per run — a fresh row per adaptation, distinct from the
original research job (BUILD-PLAN.md Phase 6).

For each of the 3 channels: adapt the approved article, then run the same
bounded evaluate/revise loop Phase 4 built for article options — capped at
`MAX_REVISION_CYCLES` — with each revision inserted as a new versioned
`channel_content` row (`revision_source="ai_revision"`). Ends with
`content_requests.status = "channel_review"`.
"""
from __future__ import annotations

import uuid

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.channels.adapter import adapt_for_channel
from app.channels.evaluation import evaluate_channel_content
from app.channels.revision import revise_channel_content
from app.db.session import get_session_factory
from app.evaluation.pipeline import MAX_REVISION_CYCLES, insert_evaluation_for_channel_content
from app.generation.claude_client import GenerationError
from app.generation.context import build_context_for_draft
from app.pipeline.job_tracker import JobTracker, now

CHANNELS = ["linkedin", "x", "newsletter"]


async def _fail(
    session_factory,
    job: JobTracker | None,
    job_uuid: uuid.UUID,
    request_uuid: uuid.UUID,
    message: str,
) -> None:
    async with session_factory() as session:
        tracker = job if job is not None else JobTracker(session, job_uuid)
        tracker.session = session
        await tracker.fail_step(message)
        await session.execute(
            text("UPDATE content_requests SET status = 'failed', updated_at = :now WHERE id = :id"),
            {"now": now(), "id": request_uuid},
        )
        await session.commit()


async def _evaluate_and_revise_one(
    session: AsyncSession,
    channel: str,
    content_row,
    context,
) -> bool:
    """Runs the evaluate/revise loop for one channel's content. Returns True if revised at least once."""
    current_id = content_row.id
    current_version = content_row.version
    current_subject = content_row.subject
    current_body = content_row.body
    revised = False

    for attempt in range(MAX_REVISION_CYCLES + 1):
        evaluation = evaluate_channel_content(channel, current_subject, current_body, context)
        await insert_evaluation_for_channel_content(session, current_id, evaluation)

        if evaluation["overall_status"] == "pass" or attempt == MAX_REVISION_CYCLES:
            break

        revised_content = revise_channel_content(
            channel, current_subject, current_body, evaluation, context
        )
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
                    "draft_id": content_row.draft_id,
                    "channel": channel,
                    "version": current_version + 1,
                    "parent_content_id": current_id,
                    "subject": revised_content.get("subject"),
                    "body": revised_content["body"],
                },
            )
        ).scalar_one()
        await session.commit()

        current_id, current_version, current_subject, current_body = (
            new_id,
            current_version + 1,
            revised_content.get("subject"),
            revised_content["body"],
        )
        revised = True

    await session.execute(
        text("UPDATE channel_content SET status = 'evaluated', updated_at = :now WHERE id = :id"),
        {"now": now(), "id": current_id},
    )
    await session.commit()
    return revised


async def _adapt_and_evaluate_channel(
    session_factory,
    job: JobTracker,
    draft_id: uuid.UUID,
    article_title: str,
    article_body: str,
    channel: str,
) -> None:
    async with session_factory() as session:
        job.session = session
        context = await build_context_for_draft(session, draft_id)
        adapted = adapt_for_channel(channel, article_title, article_body, context)

        content_row = (
            await session.execute(
                text(
                    """
                    INSERT INTO channel_content (draft_id, channel, version, revision_source, subject, body, status)
                    VALUES (:draft_id, :channel, 1, 'initial', :subject, :body, 'drafted')
                    RETURNING id, draft_id, version, subject, body
                    """
                ),
                {
                    "draft_id": draft_id,
                    "channel": channel,
                    "subject": adapted.get("subject"),
                    "body": adapted["body"],
                },
            )
        ).one()
        await session.commit()

        await _evaluate_and_revise_one(session, channel, content_row, context)


async def run_channel_adaptation_pipeline(request_id: str, research_job_id: str, draft_id: str) -> None:
    session_factory = get_session_factory()
    request_uuid = uuid.UUID(request_id)
    job_uuid = uuid.UUID(research_job_id)
    draft_uuid = uuid.UUID(draft_id)
    job: JobTracker | None = None

    try:
        async with session_factory() as session:
            job = JobTracker(session, job_uuid)
            await job.start_step("adapting_channels", "Adapting article for each channel")

            draft_row = (
                await session.execute(
                    text("SELECT title, body_markdown FROM article_drafts WHERE id = :id"),
                    {"id": draft_uuid},
                )
            ).one()

        for channel in CHANNELS:
            await _adapt_and_evaluate_channel(
                session_factory, job, draft_uuid, draft_row.title, draft_row.body_markdown, channel
            )

        async with session_factory() as final_session:
            job.session = final_session
            await job.complete_step(f"Adapted and evaluated content for {len(CHANNELS)} channels")

            await job.succeed()
            await final_session.execute(
                text("UPDATE content_requests SET status = 'channel_review', updated_at = :now WHERE id = :id"),
                {"now": now(), "id": request_uuid},
            )
            await final_session.commit()

    except GenerationError as exc:
        await _fail(session_factory, job, job_uuid, request_uuid, str(exc))
    except Exception as exc:  # unexpected — still surface, never leave the job hanging
        await _fail(session_factory, job, job_uuid, request_uuid, f"Unexpected error: {exc}")
