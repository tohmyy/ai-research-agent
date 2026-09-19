"""Evaluates adapted channel content — the article rubric plus "Channel
Fit" (assets/content-evaluation-rubric.md), the one criterion that only
applies once content has been adapted per-channel.
"""
from __future__ import annotations

from app.evaluation.rubric import ARTICLE_CRITERIA
from app.generation.claude_client import generate_structured
from app.generation.context import SourceContext

CHANNEL_CRITERIA = ARTICLE_CRITERIA + ["Channel Fit"]

_CHANNEL_RULES_SUMMARY = {
    "linkedin": "LinkedIn: PAS structure (problem, agitation, solution), short paragraphs, "
    "sparing relevant emojis, a clear call to action.",
    "x": "X: leads with the hook, one core idea, line breaks, at most 1-2 hashtags, "
    "under 280 characters total.",
    "newsletter": "Newsletter: strong subject line, short intro, skimmable body with "
    "subheadings/bullets, a clear call to action, friendly sign-off, 250-600 words.",
}

SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "properties": {
        "overall_status": {
            "type": "string",
            "enum": ["pass", "revise", "reject"],
        },
        "criterion_scores": {
            "type": "array",
            "minItems": 1,
            "items": {
                "type": "object",
                "additionalProperties": False,
                "properties": {
                    "criterion": {"type": "string", "enum": CHANNEL_CRITERIA},
                    "score": {
                        "type": "integer",
                        "description": "1 (poor) to 10 (excellent).",
                    },
                    "note": {"type": "string"},
                },
                "required": ["criterion", "score", "note"],
            },
        },
        "unsupported_claims": {
            "type": "array",
            "items": {"type": "string"},
        },
        "sections_needing_revision": {
            "type": "array",
            "items": {"type": "string"},
        },
        "recommended_changes": {
            "type": "array",
            "items": {"type": "string"},
        },
    },
    "required": [
        "overall_status",
        "criterion_scores",
        "unsupported_claims",
        "sections_needing_revision",
        "recommended_changes",
    ],
}


def _system_prompt(channel: str) -> str:
    return f"""You are a strict but fair editor evaluating adapted {channel} content before it \
reaches a human reviewer, using this rubric:

- Topic Relevance: does it answer the original request and stay focused on the topic?
- Source Grounding: do claims connect back to the reviewed source material below?
- Factual Consistency: does it avoid contradictions, unsupported claims, and invented details?
- Audience Fit: does it speak to the target audience at the right depth?
- Tone: does the style match a professional marketing brand voice?
- SEO Fit: are relevant keywords used naturally where applicable to this channel?
- Clarity: is it easy to read, skimmable, and direct?
- Completeness: does it include every expected element for this channel?
- Channel Fit: does it follow this platform's specific formatting rules? {_CHANNEL_RULES_SUMMARY[channel]}

Score each of these 9 criteria from 1 (poor) to 10 (excellent) with a short note. Set \
overall_status to "pass" only if it's ready for human review as-is; "revise" if specific, \
fixable issues remain; "reject" only if fundamentally unusable. List every unsupported \
claim verbatim, the specific sections needing revision, and concrete recommended changes.
"""


def evaluate_channel_content(
    channel: str,
    subject: str | None,
    body: str,
    context: SourceContext,
) -> dict:
    content_block = f"Subject: {subject}\n\n{body}" if subject else body
    user_prompt = f"""Reviewed source material:
{context.text}

Adapted {channel} content to evaluate:

{content_block}
"""

    return generate_structured(
        system=_system_prompt(channel),
        user=user_prompt,
        tool_name="evaluate_channel_content",
        tool_description="Evaluate the adapted channel content against the rubric.",
        input_schema=SCHEMA,
    )
