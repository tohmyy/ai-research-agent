"""Generation pipeline orchestration.

Called directly from the research pipeline once research succeeds — they
share one `research_jobs` row/`JobTracker` so the UI sees one continuous
sequence of steps (BUILD-PLAN.md Phase 3, ui-design-spec.md §22-23).

Sequence: build context from the request's included sources -> propose a
few distinct article angles -> write a full article per angle -> mark
`content_requests.status = "options_ready"`. Any failure propagates to the
caller, which fails the job/request exactly like a research failure.
"""
from __future__ import annotations

import json
import uuid

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.generation.claude_client import GenerationError
from app.generation.context import build_source_context
from app.generation.drafting import generate_article
from app.generation.planning import generate_plan
from app.pipeline.job_tracker import JobTracker, now
from app.rag.embeddings import embed_query
from app.rag.retrieval import top_chunks

# Claude occasionally returns a well-formed but empty/short angle list for
# the same prompt (sampling variance, not a deterministic prompt problem —
# confirmed by re-running the identical call). One retry resolves it.
MAX_PLAN_ATTEMPTS = 2


async def run_generation_pipeline(
    session: AsyncSession,
    job: JobTracker,
    request_uuid: uuid.UUID,
    request_row,
) -> None:
    await job.start_step("planning", "Planning content angles")

    query_text = f"{request_row.raw_idea}\n\nTarget audience: {request_row.target_audience}"
    query_embedding = embed_query(query_text)
    chunks = await top_chunks(session, request_uuid, query_embedding, limit=20)
    context = build_source_context(chunks)

    plan = None
    last_error: Exception | None = None
    for attempt in range(1, MAX_PLAN_ATTEMPTS + 1):
        try:
            plan = generate_plan(
                request_row.raw_idea,
                request_row.target_audience,
                request_row.additional_instructions,
                context,
            )
            break
        except GenerationError as exc:
            last_error = exc
    if plan is None:
        raise GenerationError(
            f"Content planning failed after {MAX_PLAN_ATTEMPTS} attempts: {last_error}"
        )
    angles = plan["angles"]

    await session.execute(
        text(
            "INSERT INTO content_plans (request_id, plan_json) VALUES (:request_id, CAST(:plan_json AS jsonb))"
        ),
        {"request_id": request_uuid, "plan_json": json.dumps(plan)},
    )
    await session.commit()
    await job.complete_step(f"{len(angles)} article angles planned")

    await job.start_step("generating_options", "Generating article options")
    for angle in angles:
        article = generate_article(
            request_row.raw_idea, request_row.target_audience, angle, context
        )

        draft_id = (
            await session.execute(
                text(
                    """
                    INSERT INTO article_drafts (request_id, variant_label, title, body_markdown, status)
                    VALUES (:request_id, :variant_label, :title, :body_markdown, 'drafted')
                    RETURNING id
                    """
                ),
                {
                    "request_id": request_uuid,
                    "variant_label": angle["variant_label"],
                    "title": article["title"],
                    "body_markdown": article["body_markdown"],
                },
            )
        ).scalar_one()

        for source_id, chunk_ids in context.chunk_ids_by_source.items():
            await session.execute(
                text(
                    """
                    INSERT INTO draft_sources (draft_id, source_id, chunk_ids)
                    VALUES (:draft_id, :source_id, :chunk_ids)
                    """
                ),
                {
                    "draft_id": draft_id,
                    "source_id": source_id,
                    "chunk_ids": list(chunk_ids),
                },
            )
    await session.commit()
    await job.complete_step(f"{len(angles)} article options generated")

    await job.succeed()
    await session.execute(
        text("UPDATE content_requests SET status = 'options_ready', updated_at = :now WHERE id = :id"),
        {"now": now(), "id": request_uuid},
    )
    await session.commit()
