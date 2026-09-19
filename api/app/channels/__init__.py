"""Channel adaptation stage.

Adapts an approved article into LinkedIn, X, and newsletter content, each
using `assets/channel-formatting-rules.md` as the system-prompt contract for
that channel, then runs each adapted piece through the Phase 4 evaluation
module before it reaches human review.

See `prompts.py`, `adapter.py`, `evaluation.py`, `revision.py`, `pipeline.py`
(orchestration, triggered via `POST /pipeline/adapt-channels`), and
`router.py` (the reviewer-triggered `request-revision` endpoint).
"""
