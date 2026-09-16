"""Assembles retrieved chunks into a labeled context block for Claude prompts."""
from __future__ import annotations

import uuid
from dataclasses import dataclass


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
