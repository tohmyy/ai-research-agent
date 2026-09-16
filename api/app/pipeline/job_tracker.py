"""Shared `research_jobs` progress tracking.

Used by both the research pipeline (Phase 2) and the generation pipeline
(Phase 3) — they share one job row per pipeline run, so the UI's activity
timeline shows one continuous sequence of steps across research, planning,
and generation.
"""
from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


def now() -> datetime:
    """Naive UTC datetime — matches the schema's timestamp-without-timezone columns."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


class JobTracker:
    """Accumulates `research_jobs.steps` entries and persists the whole
    array plus `stage`/`status` on every update (small scale, fine to
    read-modify-write wholesale rather than append server-side)."""

    def __init__(self, session: AsyncSession, job_id: uuid.UUID):
        self.session = session
        self.job_id = job_id
        self.steps: list[dict] = []

    async def start_step(self, key: str, label: str) -> None:
        self.steps.append(
            {"key": key, "label": label, "status": "active", "detail": None, "at": now().isoformat()}
        )
        await self._persist(stage=key, status="running")

    async def complete_step(self, detail: str | None = None) -> None:
        self.steps[-1]["status"] = "complete"
        self.steps[-1]["detail"] = detail
        self.steps[-1]["at"] = now().isoformat()
        await self._persist(status="running")

    async def fail_step(self, error: str) -> None:
        if self.steps:
            self.steps[-1]["status"] = "failed"
            self.steps[-1]["detail"] = error
            self.steps[-1]["at"] = now().isoformat()
        await self._persist(status="failed", error=error, completed=True)

    async def succeed(self) -> None:
        await self._persist(status="succeeded", completed=True)

    async def _persist(
        self,
        *,
        stage: str | None = None,
        status: str,
        error: str | None = None,
        completed: bool = False,
    ) -> None:
        params: dict = {
            "job_id": self.job_id,
            "steps": json.dumps(self.steps),
            "status": status,
        }
        set_clauses = ["steps = CAST(:steps AS jsonb)", "status = :status"]
        if stage is not None:
            set_clauses.append("stage = :stage")
            params["stage"] = stage
        if error is not None:
            set_clauses.append("error = :error")
            params["error"] = error
        if completed:
            set_clauses.append("completed_at = :completed_at")
            params["completed_at"] = now()
        await self.session.execute(
            text(f"UPDATE research_jobs SET {', '.join(set_clauses)} WHERE id = :job_id"),
            params,
        )
        await self.session.commit()
