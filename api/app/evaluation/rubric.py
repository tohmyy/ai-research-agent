"""The evaluation tool schema and system prompt, encoding
`assets/content-evaluation-rubric.md` directly.

Uses the 8 criteria that apply to an unadapted article. "Channel Fit" is
excluded here — it only applies once content has been adapted per-channel
(Phase 6), which reuses this same module for that evaluation instead.
"""
from __future__ import annotations

ARTICLE_CRITERIA = [
    "Topic Relevance",
    "Source Grounding",
    "Factual Consistency",
    "Audience Fit",
    "Tone",
    "SEO Fit",
    "Clarity",
    "Completeness",
]

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
                    "criterion": {"type": "string", "enum": ARTICLE_CRITERIA},
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
            "description": "Specific claims, stats, or quotes not backed by the source material.",
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

SYSTEM_PROMPT = f"""You are a strict but fair editor evaluating a draft article before it \
reaches a human reviewer, using this rubric:

- Topic Relevance: does the content answer the request and stay focused on the topic?
- Source Grounding: do claims, examples, and recommendations connect back to the reviewed \
source material below?
- Factual Consistency: does the content avoid contradictions, unsupported claims, and \
invented details?
- Audience Fit: does the content speak to the target audience at the right depth?
- Tone: does the style match a professional marketing brand voice?
- SEO Fit: does the article use the primary keyword, relevant secondary keywords, clear \
headings, and useful links?
- Clarity: is the content easy to read, skimmable, and direct?
- Completeness: does it include every expected section?

Score each of these 8 criteria from 1 (poor) to 10 (excellent) with a short note. Set \
overall_status to "pass" only if the draft is ready for human review as-is; "revise" if \
specific, fixable issues remain; "reject" only if the draft is fundamentally unusable. \
List every unsupported claim you find verbatim, the specific sections needing revision, \
and concrete recommended changes — vague feedback is not useful.
"""
