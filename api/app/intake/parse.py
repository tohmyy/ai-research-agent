"""Parse a free-text content prompt into structured request fields."""
from __future__ import annotations

from app.generation.claude_client import EVAL_MODEL, generate_structured

_SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "properties": {
        "raw_idea": {
            "type": "string",
            "description": "The core content idea or topic to write about.",
        },
        "target_audience": {
            "type": "string",
            "description": "Who the content is for. Empty string if not stated.",
        },
        "supporting_material": {
            "type": "string",
            "description": "Notes, excerpts, or context that is not the main idea.",
        },
        "source_url": {
            "type": "string",
            "description": "First http(s) URL mentioned, or empty string.",
        },
        "additional_instructions": {
            "type": "string",
            "description": "Tone, angle, restrictions, length, or other requirements.",
        },
    },
    "required": [
        "raw_idea",
        "target_audience",
        "supporting_material",
        "source_url",
        "additional_instructions",
    ],
}

_SYSTEM_PROMPT = """You categorize a free-form content request into structured fields.

Rules:
- Extract and categorize only what the user actually wrote. Do not invent an \
audience, URL, or requirements that are not present.
- raw_idea: the core topic or idea to write about. If the whole prompt is the \
idea, put it here (you may lightly clean filler).
- target_audience: who the content is for. Use an empty string if not stated — \
never guess.
- supporting_material: background notes, excerpts, or context that is not the \
main idea. Empty string if none.
- source_url: the first valid http:// or https:// URL in the prompt, or empty \
string. Do not invent URLs.
- additional_instructions: tone, angle, length, restrictions, or other \
requirements. Empty string if none.
- Prefer empty strings over fabricated values when uncertain.
"""


def parse_prompt(prompt: str) -> dict[str, str]:
    """Return structured intake fields for `prompt`."""
    result = generate_structured(
        system=_SYSTEM_PROMPT,
        user=prompt.strip(),
        tool_name="categorize_content_request",
        tool_description=(
            "Categorize the free-text content request into structured fields."
        ),
        input_schema=_SCHEMA,
        model=EVAL_MODEL,
        # See claude_client.generate_structured's docstring: this flat,
        # all-required, multi-string-property schema reliably corrupts
        # under strict=True (leaked tool-call syntax inside field values,
        # reproduced repeatedly on both Sonnet and Haiku). strict=False is
        # clean and consistent for this exact schema shape.
        strict=False,
    )

    def _str(key: str) -> str:
        value = result.get(key)
        return value.strip() if isinstance(value, str) else ""

    return {
        "raw_idea": _str("raw_idea"),
        "target_audience": _str("target_audience"),
        "supporting_material": _str("supporting_material"),
        "source_url": _str("source_url"),
        "additional_instructions": _str("additional_instructions"),
    }
