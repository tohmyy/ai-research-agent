"""Whole-article AI Assistant edits (ui-design-spec.md §34).

Stateless: proposes a revised article for a free-text or quick-action
instruction. The caller decides whether to keep it — nothing is persisted
here.
"""
from __future__ import annotations

from app.generation.claude_client import generate_structured
from app.generation.context import SourceContext
from app.generation.drafting import _SCHEMA

_SYSTEM_PROMPT = """You are a content editor assisting a human reviewer who is polishing an \
SEO article. Apply exactly the instruction given, and only that instruction — do not make \
unrelated changes. Keep every claim grounded in the reviewed source material below. Return \
the complete revised article, not a diff or a partial rewrite.
"""


def generate_ai_assist_edit(
    title: str,
    body_markdown: str,
    instruction: str,
    context: SourceContext,
) -> dict:
    user_prompt = f"""Reviewed source material:
{context.text}

Current draft:

# {title}

{body_markdown}

Instruction: {instruction}
"""

    return generate_structured(
        system=_SYSTEM_PROMPT,
        user=user_prompt,
        tool_name="write_article",
        tool_description="Write the revised article applying the given instruction.",
        input_schema=_SCHEMA,
    )
