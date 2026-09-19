"""Revises adapted channel content to address a specific evaluation's findings."""
from __future__ import annotations

from app.channels.prompts import CHANNEL_PROMPTS, CHANNEL_SCHEMAS
from app.generation.claude_client import generate_structured
from app.generation.context import SourceContext


def revise_channel_content(
    channel: str,
    subject: str | None,
    body: str,
    evaluation: dict,
    context: SourceContext,
) -> dict:
    current_block = f"Subject: {subject}\n\n{body}" if subject else body

    system = f"""{CHANNEL_PROMPTS[channel]}
You are revising existing {channel} content based on specific editorial feedback — address \
every issue raised while preserving what already works. Return the complete revised \
content, not a diff or partial rewrite.
"""

    user_prompt = f"""Reviewed source material:
{context.text}

Current {channel} content:

{current_block}

Editorial feedback to address:
- Unsupported claims to remove or rewrite: {"; ".join(evaluation.get("unsupported_claims", [])) or "none"}
- Sections needing revision: {"; ".join(evaluation.get("sections_needing_revision", [])) or "none"}
- Recommended changes: {"; ".join(evaluation.get("recommended_changes", [])) or "none"}
"""

    return generate_structured(
        system=system,
        user=user_prompt,
        tool_name="write_channel_content",
        tool_description=f"Write the revised {channel} content addressing the editorial feedback.",
        input_schema=CHANNEL_SCHEMAS[channel],
    )
