"""Evaluation stage.

Scores every draft (article or channel content) against
`assets/content-evaluation-rubric.md` via a Claude structured-output call,
writing `evaluations`. Drives the bounded auto-revision loop (≤2 cycles,
chained via `article_drafts.parent_draft_id`) before a human ever reviews
the draft.

Implemented in Phase 4 — see BUILD-PLAN.md. No logic lives here yet.
"""
