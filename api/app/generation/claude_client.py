"""Thin wrapper around the Claude API for structured-output calls.

Every generation call in this app forces a single tool via `tool_choice` and
reads the parsed `tool_use.input` back — this is the most portable way to
get reliable structured JSON out of Claude, regardless of prose formatting.
"""
from __future__ import annotations

from typing import Any

import anthropic

from app.config import get_settings

MODEL = "claude-sonnet-5"
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
) -> dict[str, Any]:
    """Force Claude to call `tool_name` and return its parsed input."""
    try:
        response = _client().messages.create(
            model=MODEL,
            max_tokens=MAX_TOKENS,
            system=system,
            messages=[{"role": "user", "content": user}],
            tools=[
                {
                    "name": tool_name,
                    "description": tool_description,
                    "input_schema": input_schema,
                    "strict": True,
                }
            ],
            tool_choice={"type": "tool", "name": tool_name},
        )
    except Exception as exc:
        raise GenerationError(f"Claude API call failed: {exc}") from exc

    for block in response.content:
        if block.type == "tool_use" and block.name == tool_name:
            return dict(block.input)

    raise GenerationError(
        f"Claude did not return the expected '{tool_name}' tool call."
    )
