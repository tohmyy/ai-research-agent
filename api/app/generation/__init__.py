"""Generation stage.

Builds a content plan (`content_plans`) from retrieved context, then
generates multiple full article options (`article_drafts`) via Claude
structured outputs, following `assets/seo-best-practices.md`. Populates
`draft_sources` to record which sources/chunks fed each draft.

Implemented in Phase 3 — see BUILD-PLAN.md. No logic lives here yet.
"""
