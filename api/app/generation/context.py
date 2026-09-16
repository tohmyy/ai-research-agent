"""Assembles retrieved chunks into a labeled context block for Claude prompts."""
from __future__ import annotations

import uuid
from dataclasses import dataclass

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


@dataclass
class SourceContext:
    text: str
    source_ids: list[uuid.UUID]
    chunk_ids_by_source: dict[uuid.UUID, list[uuid.UUID]]


def build_source_context(chunks: list[dict]) -> SourceContext:
    """`chunks` is the result of `rag.retrieval.top_chunks` — closest-first."""
    seen_sources: dict[uuid.UUID, int] = {}
    chunk_ids_by_source: dict[uuid.UUID, list[uuid.UUID]] = {}
    parts: list[str] = []

    for chunk in chunks:
        source_id = chunk["source_id"]
        if source_id not in seen_sources:
            seen_sources[source_id] = len(seen_sources) + 1
        label = seen_sources[source_id]
        chunk_ids_by_source.setdefault(source_id, []).append(chunk["chunk_id"])
        parts.append(
            f"[Source {label}: {chunk['title'] or chunk['url']} — {chunk['url']}]\n{chunk['chunk_text']}"
        )

    return SourceContext(
        text="\n\n".join(parts),
        source_ids=list(seen_sources.keys()),
        chunk_ids_by_source=chunk_ids_by_source,
    )


async def build_context_for_draft(session: AsyncSession, draft_id: uuid.UUID) -> SourceContext:
    """Rebuild a draft's context from its recorded `draft_sources` grounding —
    used by evaluation/revision so they check a draft against exactly what
    fed it, not a fresh (possibly different) retrieval.
    """
    result = await session.execute(
        text(
            """
            SELECT sc.id AS chunk_id, sc.source_id AS source_id, sc.chunk_text AS chunk_text,
                   s.url AS url, s.title AS title
            FROM draft_sources ds
            JOIN source_chunks sc ON sc.id = ANY(ds.chunk_ids)
            JOIN sources s ON s.id = sc.source_id
            WHERE ds.draft_id = :draft_id
            ORDER BY sc.chunk_index
            """
        ),
        {"draft_id": draft_id},
    )
    chunks = [
        {
            "chunk_id": row.chunk_id,
            "source_id": row.source_id,
            "chunk_text": row.chunk_text,
            "url": row.url,
            "title": row.title,
        }
        for row in result
    ]
    return build_source_context(chunks)
