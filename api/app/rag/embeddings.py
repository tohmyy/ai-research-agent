"""Voyage AI embeddings wrapper.

`voyage-3` outputs 1024-dimension vectors, matching `source_chunks.embedding`
in `web/lib/db/schema.ts`. Documents and queries are embedded with different
`input_type` values per Voyage's recommended asymmetric-embedding practice.
"""
from __future__ import annotations

import voyageai

from app.config import get_settings

MODEL = "voyage-3"


class EmbeddingError(Exception):
    pass


def _client() -> voyageai.Client:
    settings = get_settings()
    if not settings.VOYAGE_API_KEY:
        raise EmbeddingError("VOYAGE_API_KEY is not configured.")
    return voyageai.Client(api_key=settings.VOYAGE_API_KEY)


def embed_documents(texts: list[str]) -> list[list[float]]:
    if not texts:
        return []
    try:
        result = _client().embed(texts, model=MODEL, input_type="document")
    except Exception as exc:
        raise EmbeddingError(f"Failed to embed documents: {exc}") from exc
    return result.embeddings


def embed_query(text: str) -> list[float]:
    try:
        result = _client().embed([text], model=MODEL, input_type="query")
    except Exception as exc:
        raise EmbeddingError(f"Failed to embed query: {exc}") from exc
    return result.embeddings[0]
