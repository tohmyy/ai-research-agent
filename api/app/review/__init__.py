"""Reviewer-triggered actions on a selected article, Phase 5.

`request-revision` reuses the evaluation module's revision/evaluation
calls with a reviewer's note in place of rubric feedback. `ai-assist` is a
stateless whole-article edit proposal for the AI Assistant panel — it
writes nothing; the caller persists an accepted proposal itself via the
same path a manual edit uses.
"""
