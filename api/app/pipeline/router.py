"""Phase 1 pipeline-trigger stub.

`POST /pipeline/start` writes one `research_jobs` row and returns
immediately. It proves the Next.js -> FastAPI -> Postgres wiring end to end
without doing any real research — Phase 2 replaces the body of
`start_pipeline` with real Firecrawl/RAG logic (see BUILD-PLAN.md), without
changing this endpoint's contract.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db_session

router = APIRouter(prefix="/pipeline", tags=["pipeline"])


class StartPipelineRequest(BaseModel):
    request_id: str


class StartPipelineResponse(BaseModel):
    research_job_id: str
    status: str


@router.post("/start", response_model=StartPipelineResponse)
async def start_pipeline(
    payload: StartPipelineRequest,
    session: AsyncSession = Depends(get_db_session),
) -> StartPipelineResponse:
    try:
        request_uuid = uuid.UUID(payload.request_id)
    except ValueError as exc:
        raise HTTPException(
            status_code=400, detail="request_id must be a valid UUID"
        ) from exc

    # `research_jobs.started_at`/`completed_at` are timestamp columns without
    # a time zone, so asyncpg needs a naive datetime here (still UTC).
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    result = await session.execute(
        text(
            """
            INSERT INTO research_jobs (request_id, stage, status, started_at, completed_at)
            VALUES (:request_id, 'stub', 'succeeded', :now, :now)
            RETURNING id
            """
        ),
        {"request_id": request_uuid, "now": now},
    )
    await session.commit()
    research_job_id = result.scalar_one()

    return StartPipelineResponse(research_job_id=str(research_job_id), status="succeeded")
