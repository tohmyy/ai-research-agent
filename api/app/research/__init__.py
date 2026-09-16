"""Research stage.

Firecrawl search (idea-only requests) and Firecrawl scrape (URL-based
requests), followed by content cleaning, metadata extraction, deduplication,
and relevance ranking. Writes results to the `sources` table.

See `firecrawl_client.py` (Firecrawl wrapper) and `pipeline.py`
(orchestration + `research_jobs` tracking).
"""
