"""Pipeline trigger endpoint.

`POST /pipeline/start` creates the `research_jobs` row synchronously (fast)
and schedules the real work — `research.pipeline.run_research_pipeline` —
as a FastAPI background task, returning immediately. Next.js sets
`content_requests.status = "researching"` itself right after this call
succeeds; the background task is responsible for every later transition
(`research_complete` or `failed`), since nothing else observes it finish.
"""
from __future__ import annotations

import uuid

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db_session
from app.research.pipeline import run_research_pipeline

router = APIRouter(prefix="/pipeline", tags=["pipeline"])


class StartPipelineRequest(BaseModel):
    request_id: str


class StartPipelineResponse(BaseModel):
    research_job_id: str
    status: str


@router.post("/start", response_model=StartPipelineResponse)
async def start_pipeline(
    payload: StartPipelineRequest,
    background_tasks: BackgroundTasks,
    session: AsyncSession = Depends(get_db_session),
) -> StartPipelineResponse:
    try:
        request_uuid = uuid.UUID(payload.request_id)
    except ValueError as exc:
        raise HTTPException(
            status_code=400, detail="request_id must be a valid UUID"
        ) from exc

    result = await session.execute(
        text(
            """
            INSERT INTO research_jobs (request_id, stage, status)
            VALUES (:request_id, 'queued', 'pending')
            RETURNING id
            """
        ),
        {"request_id": request_uuid},
    )
    await session.commit()
    research_job_id = result.scalar_one()

    background_tasks.add_task(
        run_research_pipeline, str(request_uuid), str(research_job_id)
    )

    return StartPipelineResponse(research_job_id=str(research_job_id), status="pending")
