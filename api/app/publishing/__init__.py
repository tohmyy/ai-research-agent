"""Publishing stage.

The `Publisher` interface and its per-channel implementations (LinkedIn, X,
email/newsletter) — see `publisher.py`, which mirrors the sketch in
TDD.md §2. Real integrations (LinkedIn API, X API v2, SendGrid) and the
APScheduler-driven dispatch loop against `publishing_queue` land in Phase 7
— see BUILD-PLAN.md. `publish()` on every implementation currently raises
`NotImplementedError`.
"""
