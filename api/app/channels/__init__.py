"""Channel adaptation stage.

Adapts an approved article into LinkedIn, X, and newsletter content, each
using `assets/channel-formatting-rules.md` as the system-prompt contract for
that channel, then runs each adapted piece through the Phase 4 evaluation
module before it reaches human review.

Implemented in Phase 6 — see BUILD-PLAN.md. No logic lives here yet.
"""
