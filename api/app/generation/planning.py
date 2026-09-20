"""Content planning — proposes several distinct article angles for a
content request, grounded in the retrieved source context."""
from __future__ import annotations

from app.generation.claude_client import GenerationError, generate_structured
from app.generation.context import SourceContext

NUM_ARTICLE_OPTIONS = 3

_SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "properties": {
        "angles": {
            "type": "array",
            # Claude's strict tool-schema mode only supports minItems of 0 or 1 —
            # "at least 3" is enforced in code (generate_plan below) instead.
            "minItems": 1,
            "items": {
                "type": "object",
                "additionalProperties": False,
                "properties": {
                    "variant_label": {"type": "string"},
                    "angle": {
                        "type": "string",
                        "description": "One sentence describing this option's distinct angle or take.",
                    },
                    "outline": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "additionalProperties": False,
                            "properties": {
                                "heading": {"type": "string"},
                                "key_points": {
                                    "type": "array",
                                    "items": {"type": "string"},
                                },
                            },
                            "required": ["heading", "key_points"],
                        },
                    },
                    "primary_keyword": {"type": "string"},
                    "secondary_keywords": {
                        "type": "array",
                        "items": {"type": "string"},
                    },
                    "estimated_word_count": {"type": "integer"},
                },
                "required": [
                    "variant_label",
                    "angle",
                    "outline",
                    "primary_keyword",
                    "secondary_keywords",
                    "estimated_word_count",
                ],
            },
        }
    },
    "required": ["angles"],
}

_SYSTEM_PROMPT = f"""You are a content strategist planning SEO articles for a marketing team.

Given a content request and the reviewed source material below, propose exactly \
{NUM_ARTICLE_OPTIONS} genuinely distinct article angles — different framings, \
audiences-within-the-audience, or takeaways, not minor rewordings of the same idea.

For each angle, follow SEO best practices:
- Identify one primary keyword drawn from the content idea.
- Identify a handful of relevant secondary keywords from the source material.
- Outline using a clear heading structure (this becomes H2 sections in the article).
- Keep every angle grounded in the provided source material — do not invent claims \
the sources don't support.
"""


def generate_plan(
    raw_idea: str,
    target_audience: str,
    additional_instructions: str | None,
    context: SourceContext,
) -> dict:
    user_prompt = f"""Content idea: {raw_idea}
Target audience: {target_audience}
{f"Additional instructions: {additional_instructions}" if additional_instructions else ""}
"""

    plan = generate_structured(
        system=_SYSTEM_PROMPT,
        user=user_prompt,
        context_block=f"Reviewed source material:\n{context.text}",
        tool_name="propose_content_angles",
        tool_description=f"Propose exactly {NUM_ARTICLE_OPTIONS} distinct article angles with outlines and keywords.",
        input_schema=_SCHEMA,
    )

    angles = plan.get("angles") or []
    if len(angles) < NUM_ARTICLE_OPTIONS:
        raise GenerationError(
            f"Expected {NUM_ARTICLE_OPTIONS} article angles, got {len(angles)}."
        )

    return plan
