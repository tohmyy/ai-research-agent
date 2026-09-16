"""Evaluates one draft against the content evaluation rubric."""
from __future__ import annotations

from app.evaluation.rubric import SCHEMA, SYSTEM_PROMPT
from app.generation.claude_client import generate_structured
from app.generation.context import SourceContext


def evaluate_draft(title: str, body_markdown: str, context: SourceContext) -> dict:
    user_prompt = f"""Reviewed source material:
{context.text}

Draft to evaluate:

# {title}

{body_markdown}
"""

    return generate_structured(
        system=SYSTEM_PROMPT,
        user=user_prompt,
        tool_name="evaluate_content",
        tool_description="Evaluate the draft against the content evaluation rubric.",
        input_schema=SCHEMA,
    )
