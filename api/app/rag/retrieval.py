"""pgvector similarity search.

Shared by Phase 2 (relevance ranking of newly-fetched sources) and, per
BUILD-PLAN.md, Phase 3 (building grounded context for generation) — built
once here so it isn't duplicated later.
"""
from __future__ import annotations

import uuid

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


def _to_vector_literal(embedding: list[float]) -> str:
    """asyncpg has no native pgvector codec here, so the embedding is passed
    as a bracketed literal string and cast to `vector` in SQL.
    """
    return "[" + ",".join(repr(float(v)) for v in embedding) + "]"


async def best_match_per_source(
    session: AsyncSession,
    request_id: uuid.UUID,
    query_embedding: list[float],
) -> dict[str, float]:
    """Return {source_id: similarity} — each source's closest-matching chunk
    to `query_embedding`, as a 0-1 cosine similarity (higher is more similar).
    """
    result = await session.execute(
        text(
            """
            SELECT sc.source_id AS source_id,
                   MIN(sc.embedding <=> CAST(:query_vector AS vector)) AS distance
            FROM source_chunks sc
            JOIN sources s ON s.id = sc.source_id
            WHERE s.request_id = :request_id
            GROUP BY sc.source_id
            """
        ),
        {
            "query_vector": _to_vector_literal(query_embedding),
            "request_id": request_id,
        },
    )
    return {str(row.source_id): 1 - float(row.distance) for row in result}


async def top_chunks(
    session: AsyncSession,
    request_id: uuid.UUID,
    query_embedding: list[float],
    limit: int = 20,
) -> list[dict]:
    """Return the `limit` closest chunks (across all `included` sources) to
    `query_embedding`, closest first — used to assemble generation context
    without dumping whole (potentially huge) source documents.
    """
    result = await session.execute(
        text(
            """
            SELECT sc.id AS chunk_id, sc.source_id AS source_id, sc.chunk_text AS chunk_text,
                   s.url AS url, s.title AS title,
                   sc.embedding <=> CAST(:query_vector AS vector) AS distance
            FROM source_chunks sc
            JOIN sources s ON s.id = sc.source_id
            WHERE s.request_id = :request_id AND s.included = true
            ORDER BY distance ASC
            LIMIT :limit
            """
        ),
        {
            "query_vector": _to_vector_literal(query_embedding),
            "request_id": request_id,
            "limit": limit,
        },
    )
    return [
        {
            "chunk_id": row.chunk_id,
            "source_id": row.source_id,
            "chunk_text": row.chunk_text,
            "url": row.url,
            "title": row.title,
        }
        for row in result
    ]
