"""Shared "send one email" helper — used by both the notification service
(review-ready/published/publish-failed) and the newsletter `EmailPublisher`,
so provider support lives in exactly one place.

Supports SendGrid and Resend, chosen per call by `provider`. Both are
Phase 7 outbound-email options (BUILD-PLAN.md) — the notification service
picks its provider from `Settings` (env vars), the newsletter channel picks
its own independently from its `channel_configs` row, since they may use
different accounts/senders.
"""
from __future__ import annotations

import resend
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail


def send_email(
    *,
    provider: str,
    api_key: str,
    from_email: str,
    to_emails: list[str],
    subject: str,
    html_content: str,
) -> tuple[bool, str | None, str | None]:
    """Sends one email. Returns (success, external_message_id, error) —
    never raises, so callers can log the outcome unconditionally."""
    if provider == "resend":
        return _send_via_resend(api_key, from_email, to_emails, subject, html_content)
    return _send_via_sendgrid(api_key, from_email, to_emails, subject, html_content)


def _send_via_sendgrid(
    api_key: str, from_email: str, to_emails: list[str], subject: str, html_content: str
) -> tuple[bool, str | None, str | None]:
    mail = Mail(from_email=from_email, to_emails=to_emails, subject=subject, html_content=html_content)
    try:
        response = SendGridAPIClient(api_key).send(mail)
    except Exception as exc:  # SendGrid's client raises varied HTTP error types
        return False, None, f"SendGrid request failed: {exc}"

    if response.status_code not in (200, 201, 202):
        return False, None, f"SendGrid returned {response.status_code}: {response.body}"
    return True, response.headers.get("X-Message-Id"), None


def _send_via_resend(
    api_key: str, from_email: str, to_emails: list[str], subject: str, html_content: str
) -> tuple[bool, str | None, str | None]:
    resend.api_key = api_key
    try:
        result = resend.Emails.send(
            {"from": from_email, "to": to_emails, "subject": subject, "html": html_content}
        )
    except Exception as exc:  # resend's SDK raises its own HTTP error types
        return False, None, f"Resend request failed: {exc}"

    message_id = result.get("id") if isinstance(result, dict) else None
    return True, message_id, None
