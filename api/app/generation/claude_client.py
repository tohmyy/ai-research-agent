"""Thin wrapper around the Claude API for structured-output calls.

Every generation call in this app forces a single tool via `tool_choice` and
reads the parsed `tool_use.input` back — this is the most portable way to
get reliable structured JSON out of Claude, regardless of prose formatting.
"""
from __future__ import annotations

import logging
from typing import Any

import anthropic

from app.config import get_settings

logger = logging.getLogger(__name__)

MODEL = "claude-sonnet-5"
# Evaluation/scoring against a fixed rubric is well-specified, extractive
# judgment work, not creative writing — Haiku handles it well at a fraction
# of Sonnet's cost. Every call site that produces prose a human or a
# channel audience will actually read (planning, drafting, revision,
# channel adaptation, AI assist) stays on the default `MODEL` above.
EVAL_MODEL = "claude-haiku-4-5-20251001"
MAX_TOKENS = 8000


class GenerationError(Exception):
    """Raised when a Claude call fails or doesn't return the expected tool call."""


def _client() -> anthropic.Anthropic:
    settings = get_settings()
    if not settings.ANTHROPIC_API_KEY:
        raise GenerationError("ANTHROPIC_API_KEY is not configured.")
    return anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)


def generate_structured(
    *,
    system: str,
    user: str,
    tool_name: str,
    tool_description: str,
    input_schema: dict[str, Any],
    context_block: str | None = None,
    model: str = MODEL,
    strict: bool = True,
) -> dict[str, Any]:
    """Force Claude to call `tool_name` and return its parsed input.

    `context_block` is the large, mostly-static reviewed-source-material
    text that every pipeline stage re-sends. When given, it's placed as its
    own cache-marked content block ahead of `user` — since a given call
    site's `tools`/`system` are already constant across its own repeated
    invocations (e.g. `evaluate_draft` called up to 3 times per article
    option under the revision cap), this alone is enough to get real cache
    hits on the 2nd/3rd+ call without every caller building content-block
    arrays by hand.

    `strict` defaults to True (constrained decoding against `input_schema`)
    but can be disabled per call. Confirmed by direct testing: a flat,
    all-required, multi-string-property schema (e.g. intake's 5-field
    categorizer) reliably made both Sonnet 5 and Haiku 4.5 emit corrupted
    output — literal leaked tool-call-like syntax inside string field
    values — under `strict=True`, reproducing across multiple prompt
    rewordings and user inputs. The identical call with `strict=False` was
    clean across every repeat. No other schema in this codebase (all
    nested/array-shaped) has triggered this; if a future flat multi-string
    schema misbehaves the same way, try `strict=False` first.
    """
    if context_block:
        user_content: str | list[dict[str, Any]] = [
            {"type": "text", "text": context_block, "cache_control": {"type": "ephemeral"}},
            {"type": "text", "text": user},
        ]
    else:
        user_content = user

    try:
        response = _client().messages.create(
            model=model,
            max_tokens=MAX_TOKENS,
            system=system,
            messages=[{"role": "user", "content": user_content}],
            tools=[
                {
                    "name": tool_name,
                    "description": tool_description,
                    "input_schema": input_schema,
                    "strict": strict,
                }
            ],
            tool_choice={"type": "tool", "name": tool_name},
        )
    except Exception as exc:
        raise GenerationError(f"Claude API call failed: {exc}") from exc

    usage = response.usage
    logger.info(
        "generate_structured tool=%s model=%s input_tokens=%s cache_creation=%s cache_read=%s output_tokens=%s",
        tool_name,
        model,
        usage.input_tokens,
        getattr(usage, "cache_creation_input_tokens", None),
        getattr(usage, "cache_read_input_tokens", None),
        usage.output_tokens,
    )

    for block in response.content:
        if block.type == "tool_use" and block.name == tool_name:
            return dict(block.input)

    raise GenerationError(
        f"Claude did not return the expected '{tool_name}' tool call."
    )
