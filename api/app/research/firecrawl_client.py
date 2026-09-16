"""Thin wrapper around the Firecrawl SDK.

Every call raises `ResearchError` with a human-readable message on failure —
callers should not need to know anything about Firecrawl's own exception
types. No fallback behavior lives here: a failed scrape or an empty search
is a real failure, surfaced up to the pipeline (see BUILD-PLAN.md Phase 2 —
"failures are surfaced, not silently degraded").
"""
from __future__ import annotations

from typing import Any

from firecrawl import FirecrawlApp

from app.config import get_settings


class ResearchError(Exception):
    """Raised when Firecrawl search/scrape fails or returns nothing usable."""


def _client() -> FirecrawlApp:
    settings = get_settings()
    if not settings.FIRECRAWL_API_KEY:
        raise ResearchError("FIRECRAWL_API_KEY is not configured.")
    return FirecrawlApp(api_key=settings.FIRECRAWL_API_KEY)


def scrape(url: str) -> dict[str, Any]:
    """Scrape a single URL. Returns markdown content plus available metadata."""
    try:
        result = _client().scrape_url(url, params={"formats": ["markdown"]})
    except Exception as exc:  # Firecrawl raises plain Exceptions on failure.
        raise ResearchError(f"Could not extract content from {url}: {exc}") from exc

    markdown = _get(result, "markdown")
    if not markdown or not markdown.strip():
        raise ResearchError(f"No extractable content found at {url}.")

    metadata = _get(result, "metadata") or {}
    return {
        "url": url,
        "title": metadata.get("title"),
        "author": metadata.get("author"),
        "published_at": metadata.get("publishedDate") or metadata.get("published_date"),
        "markdown": markdown,
        "metadata": metadata,
    }


def search(query: str, limit: int = 5) -> list[dict[str, Any]]:
    """Search the web and return scraped markdown content per result."""
    try:
        response = _client().search(
            query,
            params={"limit": limit, "scrapeOptions": {"formats": ["markdown"]}},
        )
    except Exception as exc:
        raise ResearchError(f"Search failed for '{query}': {exc}") from exc

    results = _get(response, "data") or _get(response, "results") or []
    if not results:
        raise ResearchError(f"No search results found for '{query}'.")

    sources: list[dict[str, Any]] = []
    for item in results:
        markdown = _get(item, "markdown")
        url = _get(item, "url")
        if not url or not markdown or not markdown.strip():
            continue
        metadata = _get(item, "metadata") or {}
        sources.append(
            {
                "url": url,
                "title": _get(item, "title") or metadata.get("title"),
                "author": metadata.get("author"),
                "published_at": metadata.get("publishedDate")
                or metadata.get("published_date"),
                "markdown": markdown,
                "metadata": metadata,
            }
        )

    if not sources:
        raise ResearchError(
            f"Search for '{query}' returned results but none had extractable content."
        )

    return sources


def _get(obj: Any, key: str) -> Any:
    """Firecrawl SDK responses are sometimes dicts, sometimes attribute objects."""
    if isinstance(obj, dict):
        return obj.get(key)
    return getattr(obj, key, None)
