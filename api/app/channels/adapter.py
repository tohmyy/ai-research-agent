"""Adapts an approved article into one channel's format."""
from __future__ import annotations

from app.channels.prompts import CHANNEL_PROMPTS, CHANNEL_SCHEMAS
from app.generation.claude_client import generate_structured
from app.generation.context import SourceContext


def adapt_for_channel(
    channel: str,
    article_title: str,
    article_body: str,
    context: SourceContext,
) -> dict:
    user_prompt = f"""Approved article:

# {article_title}

{article_body}

Reviewed source material (for grounding claims only — do not restate it verbatim):
{context.text}
"""

    return generate_structured(
        system=CHANNEL_PROMPTS[channel],
        user=user_prompt,
        tool_name="write_channel_content",
        tool_description=f"Write the adapted {channel} content.",
        input_schema=CHANNEL_SCHEMAS[channel],
    )
