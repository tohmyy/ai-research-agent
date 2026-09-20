"""Notification service.

Sends SendGrid emails when content enters `options_ready` or
`channel_review`, and when a `publishing_queue` item reaches `published` or
`failed`. Every send attempt (success or failure) is logged to
`notifications`.

See `service.py` for the three `notify_*` functions.
"""
