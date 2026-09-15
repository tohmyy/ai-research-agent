"""The `Publisher` interface and placeholder per-channel implementations.

Mirrors the sketch in TDD.md §2:

    class Publisher(Protocol):
        def publish(self, channel_content: ChannelContent) -> PublishResult: ...

    class LinkedInPublisher(Publisher): ...
    class XPublisher(Publisher): ...
    class EmailPublisher(Publisher): ...

`ChannelContent` and `PublishResult` below are intentionally minimal
placeholders — just enough shape to type `Publisher.publish` against. They
are not the canonical ORM/schema representations of `channel_content` and
`publishing_queue` (TDD.md §3), which Next.js/Drizzle owns; later phases may
replace them with real models or DTOs once the publishing flow is built.

Every `publish()` implementation here raises `NotImplementedError` — real
LinkedIn/X/SendGrid integrations are Phase 7 work (see BUILD-PLAN.md).
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol


@dataclass
class ChannelContent:
    """Minimal placeholder mirroring a row of the `channel_content` table."""

    id: str
    channel: str  # "linkedin" | "x" | "newsletter"
    body: str


@dataclass
class PublishResult:
    """Minimal placeholder mirroring the outcome written to `publishing_queue`."""

    success: bool
    external_post_id: str | None = None
    error: str | None = None


class Publisher(Protocol):
    """Common interface every channel publisher implements (TDD.md §2)."""

    def publish(self, channel_content: ChannelContent) -> PublishResult:
        ...


class LinkedInPublisher:
    """Publishes approved content to LinkedIn (API `w_member_social` scope).

    Implemented in Phase 7 — see BUILD-PLAN.md.
    """

    def publish(self, channel_content: ChannelContent) -> PublishResult:
        raise NotImplementedError("LinkedInPublisher.publish is implemented in Phase 7.")


class XPublisher:
    """Publishes approved content to X via the X API v2 tweet-creation endpoint.

    Implemented in Phase 7 — see BUILD-PLAN.md.
    """

    def publish(self, channel_content: ChannelContent) -> PublishResult:
        raise NotImplementedError("XPublisher.publish is implemented in Phase 7.")


class EmailPublisher:
    """Sends the newsletter to the configured audience/list via SendGrid.

    Implemented in Phase 7 — see BUILD-PLAN.md.
    """

    def publish(self, channel_content: ChannelContent) -> PublishResult:
        raise NotImplementedError("EmailPublisher.publish is implemented in Phase 7.")
