"""Full article drafting — writes one complete article for a single
content-plan angle, grounded in the retrieved source context."""
from __future__ import annotations

from app.generation.claude_client import generate_structured
from app.generation.context import SourceContext

_SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "properties": {
        "title": {"type": "string"},
        "body_markdown": {
            "type": "string",
            "description": "The full article body in markdown, starting with a single H1 title line.",
        },
    },
    "required": ["title", "body_markdown"],
}

# Encodes assets/seo-best-practices.md directly into the prompt.
_SYSTEM_PROMPT = """You are a content writer producing an SEO article for a marketing team.

Follow these rules exactly:

Keyword Integration:
- Include the given primary keyword in the article title.
- Include the primary keyword in the first 100 words.
- Use the given secondary keywords naturally in the body and section headers.

Structure Optimization:
- Use one H1 title, H2 section headers, and H3 subheaders where needed.
- Use short paragraphs of 2 to 3 sentences.
- Let the depth of each section reflect the strength of the source material provided \
for it — do not pad sections the sources don't support.

Content Enrichment:
- Include 2 to 3 relevant links (use the source URLs provided below where appropriate).
- Keep the writing readable for a broad audience.
- Note in the body, in brackets, if one contextually relevant image would help \
(e.g. "[Image: ...]") — do not fabricate one.
- Keep every claim grounded in the reviewed source material below — never invent \
facts, statistics, or quotes the sources don't support.

Write the full article now, following the given angle and outline.
"""


def generate_article(
    raw_idea: str,
    target_audience: str,
    angle: dict,
    context: SourceContext,
) -> dict:
    outline_text = "\n".join(
        f"- {section['heading']}: {', '.join(section['key_points'])}"
        for section in angle["outline"]
    )

    user_prompt = f"""Content idea: {raw_idea}
Target audience: {target_audience}

Angle: {angle["angle"]}
Primary keyword: {angle["primary_keyword"]}
Secondary keywords: {", ".join(angle["secondary_keywords"])}
Target length: approximately {angle["estimated_word_count"]} words

Outline:
{outline_text}
"""

    return generate_structured(
        system=_SYSTEM_PROMPT,
        user=user_prompt,
        context_block=f"Reviewed source material:\n{context.text}",
        tool_name="write_article",
        tool_description="Write the full SEO article for this angle.",
        input_schema=_SCHEMA,
    )
