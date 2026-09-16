"""Revises a draft to address a specific evaluation's findings."""
from __future__ import annotations

from app.generation.claude_client import generate_structured
from app.generation.context import SourceContext
from app.generation.drafting import _SCHEMA

_SYSTEM_PROMPT = """You are a content editor revising an SEO article based on specific \
editorial feedback. Rewrite the full article addressing every issue raised — remove or \
rewrite unsupported claims, fix the sections called out as needing revision, and apply \
the recommended changes — while preserving what already works. Keep every claim grounded \
in the reviewed source material below. Return the complete revised article, not a diff \
or a partial rewrite.
"""


def revise_draft(
    title: str,
    body_markdown: str,
    evaluation: dict,
    context: SourceContext,
) -> dict:
    user_prompt = f"""Reviewed source material:
{context.text}

Current draft:

# {title}

{body_markdown}

Editorial feedback to address:
- Unsupported claims to remove or rewrite: {"; ".join(evaluation.get("unsupported_claims", [])) or "none"}
- Sections needing revision: {"; ".join(evaluation.get("sections_needing_revision", [])) or "none"}
- Recommended changes: {"; ".join(evaluation.get("recommended_changes", [])) or "none"}
"""

    return generate_structured(
        system=_SYSTEM_PROMPT,
        user=user_prompt,
        tool_name="write_article",
        tool_description="Write the revised article addressing the editorial feedback.",
        input_schema=_SCHEMA,
    )
