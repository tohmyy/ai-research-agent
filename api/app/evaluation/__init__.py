"""Evaluation stage.

Scores every draft (article or channel content) against
`assets/content-evaluation-rubric.md` via a Claude structured-output call,
writing `evaluations`. Drives the bounded auto-revision loop (≤2 cycles,
chained via `article_drafts.parent_draft_id`) before a human ever reviews
the draft.

See `rubric.py` (tool schema + system prompt), `evaluator.py`, `revision.py`,
and `pipeline.py` (the evaluate/revise loop, called from the generation
pipeline once the initial options are drafted).
"""
