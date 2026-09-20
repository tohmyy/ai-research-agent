"""The `Publisher` interface and per-channel implementations (TDD.md §2, §8).

Each `.publish()` call is a real, synchronous HTTP request to the target
platform — same blocking-call convention as `adapt_for_channel`/
`evaluate_draft` elsewhere in this codebase (called directly from async
pipeline code, not via a thread pool). Credentials are passed in as a
config dict read from `channel_configs` (see `config.py`), not read from
process env vars.

LinkedIn and X require developer app credentials this project does not yet
have (BUILD-PLAN.md Phase 7 / TDD.md §14) — both are implemented for real
against each platform's documented API shape, but could only be
compile-checked, not live-tested, this phase. Never fake a "published"
status without a genuine API success response.
"""
from __future__ import annotations

from dataclasses import dataclass

import requests
from requests_oauthlib import OAuth1

from app.emailing import send_email


@dataclass
class ChannelContent:
    """Minimal placeholder mirroring a row of the `channel_content` table."""

    id: str
    channel: str  # "linkedin" | "x" | "newsletter"
    body: str
    subject: str | None = None  # newsletter only


@dataclass
class PublishResult:
    """Minimal placeholder mirroring the outcome written to `publishing_queue`."""

    success: bool
    external_post_id: str | None = None
    error: str | None = None


class Publisher:
    """Common interface every channel publisher implements (TDD.md §2)."""

    def publish(self, channel_content: ChannelContent, config: dict) -> PublishResult:
        raise NotImplementedError


class LinkedInPublisher(Publisher):
    """Publishes approved content to LinkedIn (API `w_member_social` scope)."""

    def publish(self, channel_content: ChannelContent, config: dict) -> PublishResult:
        access_token = config.get("accessToken")
        author_urn = config.get("authorUrn")
        if not access_token or not author_urn:
            return PublishResult(success=False, error="LinkedIn is not fully configured (missing access token or author URN).")

        try:
            response = requests.post(
                "https://api.linkedin.com/v2/ugcPosts",
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "X-Restli-Protocol-Version": "2.0.0",
                    "Content-Type": "application/json",
                },
                json={
                    "author": f"urn:li:person:{author_urn}",
                    "lifecycleState": "PUBLISHED",
                    "specificContent": {
                        "com.linkedin.ugc.ShareContent": {
                            "shareCommentary": {"text": channel_content.body},
                            "shareMediaCategory": "NONE",
                        }
                    },
                    "visibility": {"com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"},
                },
                timeout=30,
            )
        except requests.RequestException as exc:
            return PublishResult(success=False, error=f"LinkedIn request failed: {exc}")

        if response.status_code not in (200, 201):
            return PublishResult(
                success=False,
                error=f"LinkedIn returned {response.status_code}: {response.text[:500]}",
            )

        # The created post's ID comes back in a response header, not the JSON body.
        post_id = response.headers.get("x-restli-id")
        return PublishResult(success=True, external_post_id=post_id)


class XPublisher(Publisher):
    """Publishes approved content to X via the X API v2 tweet-creation endpoint."""

    def publish(self, channel_content: ChannelContent, config: dict) -> PublishResult:
        api_key = config.get("apiKey")
        api_secret = config.get("apiSecret")
        access_token = config.get("accessToken")
        access_token_secret = config.get("accessTokenSecret")
        if not all([api_key, api_secret, access_token, access_token_secret]):
            return PublishResult(success=False, error="X is not fully configured (missing one or more OAuth 1.0a credentials).")

        auth = OAuth1(api_key, api_secret, access_token, access_token_secret)
        try:
            response = requests.post(
                "https://api.twitter.com/2/tweets",
                auth=auth,
                json={"text": channel_content.body},
                timeout=30,
            )
        except requests.RequestException as exc:
            return PublishResult(success=False, error=f"X request failed: {exc}")

        if response.status_code not in (200, 201):
            return PublishResult(
                success=False,
                error=f"X returned {response.status_code}: {response.text[:500]}",
            )

        post_id = (response.json().get("data") or {}).get("id")
        return PublishResult(success=True, external_post_id=post_id)


class EmailPublisher(Publisher):
    """Sends the newsletter to the configured audience/list via the
    channel's chosen email provider (SendGrid or Resend)."""

    def publish(self, channel_content: ChannelContent, config: dict) -> PublishResult:
        provider = config.get("provider") or "sendgrid"
        api_key = config.get("apiKey")
        from_email = config.get("fromEmail")
        recipients_raw = config.get("recipients")
        if not api_key or not from_email or not recipients_raw:
            return PublishResult(success=False, error="Newsletter is not fully configured (missing API key, from email, or recipients).")

        recipients = [r.strip() for r in recipients_raw.split(",") if r.strip()]
        if not recipients:
            return PublishResult(success=False, error="No valid recipient emails configured for the newsletter.")

        success, message_id, error = send_email(
            provider=provider,
            api_key=api_key,
            from_email=from_email,
            to_emails=recipients,
            subject=channel_content.subject or "Newsletter",
            html_content=channel_content.body.replace("\n", "<br>"),
        )
        if not success:
            return PublishResult(success=False, error=error)
        return PublishResult(success=True, external_post_id=message_id)
