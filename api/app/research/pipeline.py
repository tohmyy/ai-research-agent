"""Research pipeline orchestration.

Runs as a FastAPI background task (see `app/pipeline/router.py`), so it opens
its own database session rather than reusing the request-scoped one — the
request has already been responded to by the time this runs.

Sequence: fetch (search or scrape) -> write `sources` -> chunk + embed into
`source_chunks` -> rank by similarity to the request and mark the best
matches `included` -> hand off to generation, then evaluation. All three
stages share one `JobTracker` (so the UI sees one continuous run per
ui-design-spec.md §23) but each gets its *own* fresh database session —
see the comment above the stage transitions below for why. Any failure
stops the pipeline and marks both `research_jobs` and `content_requests`
as failed with a human-readable message — no silent fallback (BUILD-PLAN.md
Phase 2, PRD requirement 8).
"""
from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone
from urllib.parse import urlparse

from sqlalchemy import text

from app.db.session import get_session_factory
from app.evaluation.pipeline import run_evaluation_pipeline
from app.generation.claude_client import GenerationError
from app.generation.pipeline import run_generation_pipeline
from app.pipeline.job_tracker import JobTracker, now
from app.rag.chunking import chunk_text
from app.rag.embeddings import EmbeddingError, embed_documents, embed_query
from app.rag.retrieval import best_match_per_source
from app.research.firecrawl_client import ResearchError, scrape, search

MAX_INCLUDED_SOURCES = 6


def _normalize_url(url: str) -> str:
    parsed = urlparse(url)
    return f"{parsed.scheme}://{parsed.netloc}{parsed.path}".rstrip("/").lower()


def _parse_published_at(value: object) -> datetime | None:
    if not isinstance(value, str) or not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00")).replace(tzinfo=None)
    except ValueError:
        return None


async def _fail(
    session_factory,
    job: JobTracker | None,
    job_uuid: uuid.UUID,
    request_uuid: uuid.UUID,
    message: str,
) -> None:
    """Writes the failure with a guaranteed-fresh session/connection — the
    session active when the error occurred may itself be the dead one.
    Reuses `job`'s already-accumulated steps if it was created yet.
    """
    async with session_factory() as session:
        tracker = job if job is not None else JobTracker(session, job_uuid)
        tracker.session = session
        await tracker.fail_step(message)
        await session.execute(
            text("UPDATE content_requests SET status = 'failed', updated_at = :now WHERE id = :id"),
            {"now": now(), "id": request_uuid},
        )
        await session.commit()


async def run_research_pipeline(request_id: str, research_job_id: str) -> None:
    session_factory = get_session_factory()
    request_uuid = uuid.UUID(request_id)
    job_uuid = uuid.UUID(research_job_id)
    job: JobTracker | None = None

    try:
        async with session_factory() as session:
            job = JobTracker(session, job_uuid)

            request_row = (
                await session.execute(
                    text(
                        "SELECT raw_idea, target_audience, source_url, additional_instructions "
                        "FROM content_requests WHERE id = :id"
                    ),
                    {"id": request_uuid},
                )
            ).one()

            await job.start_step("request_received", "Request received")
            await job.complete_step()

            if request_row.source_url:
                await job.start_step("extracting", "Extracting source content")
                fetched = [scrape(request_row.source_url)]
                await job.complete_step(f"{len(fetched)} source extracted")
            else:
                await job.start_step("searching", "Searching for relevant sources")
                fetched = search(request_row.raw_idea, limit=5)
                await job.complete_step(f"{len(fetched)} sources discovered")

            await job.start_step("analyzing", "Analysing research")
            seen_urls: set[str] = set()
            source_ids: list[uuid.UUID] = []
            for item in fetched:
                normalized = _normalize_url(item["url"])
                if normalized in seen_urls:
                    continue
                seen_urls.add(normalized)

                inserted = (
                    await session.execute(
                        text(
                            """
                            INSERT INTO sources
                                (request_id, url, title, author, published_at, raw_content, cleaned_content, metadata)
                            VALUES
                                (:request_id, :url, :title, :author, :published_at, :raw_content, :cleaned_content, CAST(:metadata AS jsonb))
                            RETURNING id
                            """
                        ),
                        {
                            "request_id": request_uuid,
                            "url": item["url"],
                            "title": item.get("title"),
                            "author": item.get("author"),
                            "published_at": _parse_published_at(item.get("published_at")),
                            "raw_content": item["markdown"],
                            "cleaned_content": item["markdown"].strip(),
                            "metadata": json.dumps(item.get("metadata") or {}),
                        },
                    )
                ).scalar_one()
                source_ids.append(inserted)
            await session.commit()
            await job.complete_step(f"{len(source_ids)} sources selected")

            if not source_ids:
                raise ResearchError("No usable sources remained after deduplication.")

            await job.start_step("building_context", "Building research context")
            for source_id, item in zip(source_ids, fetched):
                chunks = chunk_text(item["markdown"])
                if not chunks:
                    continue
                embeddings = embed_documents(chunks)
                for index, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
                    await session.execute(
                        text(
                            """
                            INSERT INTO source_chunks (source_id, chunk_index, chunk_text, embedding)
                            VALUES (:source_id, :chunk_index, :chunk_text, CAST(:embedding AS vector))
                            """
                        ),
                        {
                            "source_id": source_id,
                            "chunk_index": index,
                            "chunk_text": chunk,
                            "embedding": "[" + ",".join(repr(float(v)) for v in embedding) + "]",
                        },
                    )
            await session.commit()

            query_text = f"{request_row.raw_idea}\n\nTarget audience: {request_row.target_audience}"
            query_embedding = embed_query(query_text)
            similarities = await best_match_per_source(session, request_uuid, query_embedding)

            ranked = sorted(source_ids, key=lambda sid: similarities.get(str(sid), 0), reverse=True)
            included_ids = set(ranked[:MAX_INCLUDED_SOURCES])
            for source_id in source_ids:
                await session.execute(
                    text("UPDATE sources SET relevance_score = :score, included = :included WHERE id = :id"),
                    {
                        "score": similarities.get(str(source_id)),
                        "included": source_id in included_ids,
                        "id": source_id,
                    },
                )
            await session.commit()
            await job.complete_step(f"{len(included_ids)} of {len(source_ids)} sources selected as most relevant")

            await session.execute(
                text("UPDATE content_requests SET status = 'research_complete', updated_at = :now WHERE id = :id"),
                {"now": now(), "id": request_uuid},
            )
            await session.commit()

        # Each stage below gets its own fresh session, fully closed before
        # the next opens. A single long-lived session across the whole
        # multi-minute pipeline was observed to occasionally get dropped by
        # Supabase's pooler mid-run — nesting a later stage's session
        # inside an earlier one still leaves the earlier one open (and
        # idle) for the duration, so each stage's `async with` block must
        # exit completely before the next begins.
        async with session_factory() as session:
            job.session = session
            await run_generation_pipeline(session, job, request_uuid, request_row)

        async with session_factory() as session:
            job.session = session
            await run_evaluation_pipeline(session, job, request_uuid)

    except (ResearchError, EmbeddingError, GenerationError) as exc:
        await _fail(session_factory, job, job_uuid, request_uuid, str(exc))
    except Exception as exc:  # unexpected — still surface, never leave the job hanging
        await _fail(session_factory, job, job_uuid, request_uuid, f"Unexpected error: {exc}")
