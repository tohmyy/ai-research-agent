"""Generation stage.

Builds a content plan (`content_plans`) from retrieved context, then
generates multiple full article options (`article_drafts`) via Claude
structured outputs, following `assets/seo-best-practices.md`. Populates
`draft_sources` to record which sources/chunks fed each draft.

See `claude_client.py` (structured-output wrapper), `context.py` (assembles
retrieved chunks into a labeled prompt block), `planning.py`, `drafting.py`,
and `pipeline.py` (orchestration, called from the research pipeline).
"""
