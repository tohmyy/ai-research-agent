"""Research pipeline orchestration.

Runs as a FastAPI background task (see `app/pipeline/router.py`), so it opens
its own database session rather than reusing the request-scoped one — the
request has already been responded to by the time this runs.

Sequence: fetch (search or scrape) -> write `sources` -> chunk + embed into
`source_chunks` -> rank by similarity to the request and mark the best
matches `included`. Every milestone appends to `research_jobs.steps` so the
UI's activity timeline (ui-design-spec.md §23) can show real progress.
Any failure stops the pipeline and marks both `research_jobs` and
`content_requests` as failed with a human-readable message — no silent
fallback (BUILD-PLAN.md Phase 2, PRD requirement 8).
"""
from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone
from urllib.parse import urlparse

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session_factory
from app.rag.chunking import chunk_text
from app.rag.embeddings import EmbeddingError, embed_documents, embed_query
from app.rag.retrieval import best_match_per_source
from app.research.firecrawl_client import ResearchError, scrape, search

MAX_INCLUDED_SOURCES = 6


def _now() -> datetime:
    """Naive UTC datetime — matches the schema's timestamp-without-timezone columns."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


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


class _JobTracker:
    """Accumulates `research_jobs.steps` entries and persists the whole
    array plus `stage`/`status` on every update (small scale, fine to
    read-modify-write wholesale rather than append server-side)."""

    def __init__(self, session: AsyncSession, job_id: uuid.UUID):
        self.session = session
        self.job_id = job_id
        self.steps: list[dict] = []

    async def start_step(self, key: str, label: str) -> None:
        self.steps.append(
            {"key": key, "label": label, "status": "active", "detail": None, "at": _now().isoformat()}
        )
        await self._persist(stage=key, status="running")

    async def complete_step(self, detail: str | None = None) -> None:
        self.steps[-1]["status"] = "complete"
        self.steps[-1]["detail"] = detail
        self.steps[-1]["at"] = _now().isoformat()
        await self._persist(status="running")

    async def fail_step(self, error: str) -> None:
        if self.steps:
            self.steps[-1]["status"] = "failed"
            self.steps[-1]["detail"] = error
            self.steps[-1]["at"] = _now().isoformat()
        await self._persist(status="failed", error=error, completed=True)

    async def succeed(self) -> None:
        await self._persist(status="succeeded", completed=True)

    async def _persist(
        self,
        *,
        stage: str | None = None,
        status: str,
        error: str | None = None,
        completed: bool = False,
    ) -> None:
        params: dict = {
            "job_id": self.job_id,
            "steps": json.dumps(self.steps),
            "status": status,
        }
        set_clauses = ["steps = CAST(:steps AS jsonb)", "status = :status"]
        if stage is not None:
            set_clauses.append("stage = :stage")
            params["stage"] = stage
        if error is not None:
            set_clauses.append("error = :error")
            params["error"] = error
        if completed:
            set_clauses.append("completed_at = :completed_at")
            params["completed_at"] = _now()
        await self.session.execute(
            text(f"UPDATE research_jobs SET {', '.join(set_clauses)} WHERE id = :job_id"),
            params,
        )
        await self.session.commit()


async def run_research_pipeline(request_id: str, research_job_id: str) -> None:
    session_factory = get_session_factory()
    async with session_factory() as session:
        job = _JobTracker(session, uuid.UUID(research_job_id))
        request_uuid = uuid.UUID(request_id)

        try:
            request_row = (
                await session.execute(
                    text(
                        "SELECT raw_idea, target_audience, source_url FROM content_requests WHERE id = :id"
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

            await job.succeed()
            await session.execute(
                text("UPDATE content_requests SET status = 'research_complete', updated_at = :now WHERE id = :id"),
                {"now": _now(), "id": request_uuid},
            )
            await session.commit()

        except (ResearchError, EmbeddingError) as exc:
            await session.rollback()
            await job.fail_step(str(exc))
            await session.execute(
                text("UPDATE content_requests SET status = 'failed', updated_at = :now WHERE id = :id"),
                {"now": _now(), "id": request_uuid},
            )
            await session.commit()
        except Exception as exc:  # unexpected — still surface, never leave the job hanging
            await session.rollback()
            await job.fail_step(f"Unexpected error: {exc}")
            await session.execute(
                text("UPDATE content_requests SET status = 'failed', updated_at = :now WHERE id = :id"),
                {"now": _now(), "id": request_uuid},
            )
            await session.commit()
