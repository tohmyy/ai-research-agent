"""Evaluation + bounded revision pipeline.

Called directly from the generation pipeline once the initial article
options exist — they share one `research_jobs` row/`JobTracker`, so the UI
sees one continuous run (BUILD-PLAN.md Phase 4).

For each of the 3 generated options: evaluate against the rubric; if
`revise`/`reject` and revision cycles remain, generate a new version
addressing the feedback and evaluate again — capped at
`MAX_REVISION_CYCLES` revisions (TDD.md §5) so a persistently weak draft is
left for the human reviewer instead of looping forever. Ends with
`content_requests.status = "options_ready"`.
"""
from __future__ import annotations

import json
import uuid

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session_factory
from app.evaluation.evaluator import evaluate_draft
from app.evaluation.revision import revise_draft
from app.generation.context import build_context_for_draft
from app.pipeline.job_tracker import JobTracker, now

MAX_REVISION_CYCLES = 2


def format_recommended_changes(evaluation: dict) -> str:
    lines: list[str] = []
    sections = evaluation.get("sections_needing_revision") or []
    if sections:
        lines.append("Sections needing revision:")
        lines.extend(f"- {s}" for s in sections)
    changes = evaluation.get("recommended_changes") or []
    if changes:
        lines.append("Recommended changes:")
        lines.extend(f"- {c}" for c in changes)
    return "\n".join(lines)


async def insert_evaluation(session: AsyncSession, draft_id: uuid.UUID, evaluation: dict) -> None:
    await session.execute(
        text(
            """
            INSERT INTO evaluations (draft_id, criterion_scores, overall_status, unsupported_claims, recommended_changes)
            VALUES (:draft_id, CAST(:criterion_scores AS jsonb), :overall_status, CAST(:unsupported_claims AS jsonb), :recommended_changes)
            """
        ),
        {
            "draft_id": draft_id,
            "criterion_scores": json.dumps(evaluation["criterion_scores"]),
            "overall_status": evaluation["overall_status"],
            "unsupported_claims": json.dumps(evaluation.get("unsupported_claims") or []),
            "recommended_changes": format_recommended_changes(evaluation),
        },
    )
    await session.commit()


async def insert_evaluation_for_channel_content(
    session: AsyncSession, channel_content_id: uuid.UUID, evaluation: dict
) -> None:
    await session.execute(
        text(
            """
            INSERT INTO evaluations (channel_content_id, criterion_scores, overall_status, unsupported_claims, recommended_changes)
            VALUES (:channel_content_id, CAST(:criterion_scores AS jsonb), :overall_status, CAST(:unsupported_claims AS jsonb), :recommended_changes)
            """
        ),
        {
            "channel_content_id": channel_content_id,
            "criterion_scores": json.dumps(evaluation["criterion_scores"]),
            "overall_status": evaluation["overall_status"],
            "unsupported_claims": json.dumps(evaluation.get("unsupported_claims") or []),
            "recommended_changes": format_recommended_changes(evaluation),
        },
    )
    await session.commit()


async def copy_draft_sources(session: AsyncSession, from_draft_id: uuid.UUID, to_draft_id: uuid.UUID) -> None:
    rows = (
        await session.execute(
            text("SELECT source_id, chunk_ids FROM draft_sources WHERE draft_id = :draft_id"),
            {"draft_id": from_draft_id},
        )
    ).all()
    for row in rows:
        await session.execute(
            text(
                "INSERT INTO draft_sources (draft_id, source_id, chunk_ids) VALUES (:draft_id, :source_id, :chunk_ids)"
            ),
            {"draft_id": to_draft_id, "source_id": row.source_id, "chunk_ids": list(row.chunk_ids)},
        )
    await session.commit()


async def _evaluate_and_revise_one(session: AsyncSession, draft_row) -> bool:
    """Runs the evaluate/revise loop for one option. Returns True if it was revised at least once."""
    current_id = draft_row.id
    current_version = draft_row.version
    current_title = draft_row.title
    current_body = draft_row.body_markdown
    revised = False

    for attempt in range(MAX_REVISION_CYCLES + 1):
        context = await build_context_for_draft(session, current_id)
        evaluation = evaluate_draft(current_title, current_body, context)
        await insert_evaluation(session, current_id, evaluation)

        if evaluation["overall_status"] == "pass" or attempt == MAX_REVISION_CYCLES:
            break

        new_article = revise_draft(current_title, current_body, evaluation, context)
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
                    "request_id": draft_row.request_id,
                    "version": current_version + 1,
                    "parent_draft_id": current_id,
                    "variant_label": draft_row.variant_label,
                    "title": new_article["title"],
                    "body_markdown": new_article["body_markdown"],
                },
            )
        ).scalar_one()
        await session.commit()
        await copy_draft_sources(session, current_id, new_id)

        current_id, current_version, current_title, current_body = (
            new_id,
            current_version + 1,
            new_article["title"],
            new_article["body_markdown"],
        )
        revised = True

    await session.execute(
        text("UPDATE article_drafts SET status = 'evaluated', updated_at = :now WHERE id = :id"),
        {"now": now(), "id": current_id},
    )
    await session.commit()
    return revised


async def run_evaluation_pipeline(
    session: AsyncSession,
    job: JobTracker,
    request_uuid: uuid.UUID,
) -> None:
    await job.start_step("evaluating", "Evaluating draft quality")

    root_drafts = (
        await session.execute(
            text(
                "SELECT id, request_id, version, variant_label, title, body_markdown "
                "FROM article_drafts WHERE request_id = :request_id AND parent_draft_id IS NULL "
                "ORDER BY created_at"
            ),
            {"request_id": request_uuid},
        )
    ).all()

    # Each option gets its own fresh session (up to 3 Claude calls apiece)
    # rather than sharing one across all 3 options — bounds how long any
    # single connection sits idle between calls (see research/pipeline.py).
    session_factory = get_session_factory()
    revised_count = 0
    for draft_row in root_drafts:
        async with session_factory() as option_session:
            job.session = option_session
            if await _evaluate_and_revise_one(option_session, draft_row):
                revised_count += 1

    async with session_factory() as session:
        job.session = session
        await job.complete_step(
            f"Evaluated {len(root_drafts)} options, revised {revised_count}"
        )

        await job.succeed()
        await session.execute(
            text("UPDATE content_requests SET status = 'options_ready', updated_at = :now WHERE id = :id"),
            {"now": now(), "id": request_uuid},
        )
        await session.commit()
