"""Notification service.

Sends SendGrid emails when content enters `options_ready` or
`channel_review`, and when a `publishing_queue` item reaches `published` or
`failed`. Every send attempt (success or failure) is logged to
`notifications`.

Implemented in Phase 7 — see BUILD-PLAN.md. No logic lives here yet.
"""
