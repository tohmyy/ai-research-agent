"""FastAPI application entrypoint.

Phase 0 scope: expose a health check and set up the app factory pattern so
later phases (research, generation, evaluation, channel adaptation,
publishing — see BUILD-PLAN.md) have an obvious place to register routers.

Phase 7 adds a `lifespan` that starts an `AsyncIOScheduler` polling
`publishing_queue` for due scheduled items (TDD.md §8) — `AsyncIOScheduler`
runs its job coroutines directly on FastAPI's existing asyncio loop, unlike
`BackgroundScheduler`, which would run them on a separate OS thread and
force the async DB engine to be bridged across threads for no benefit here.
"""
import logging
from contextlib import asynccontextmanager

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from fastapi import FastAPI

from app.channels.router import router as channels_router
from app.intake.router import router as intake_router
from app.pipeline.router import router as pipeline_router
from app.publishing.router import router as publishing_router
from app.publishing.scheduler_job import poll_due_scheduled_items
from app.review.router import router as review_router

# Without this, this app's own `logging.getLogger(__name__)` loggers (Claude
# usage/cost logging, the publishing scheduler's error logging) have no
# handler and are silently dropped — uvicorn only configures its own
# "uvicorn.*" loggers by default, not the application's.
logging.basicConfig(level=logging.INFO, format="%(levelname)s:%(name)s:%(message)s")

SCHEDULER_POLL_SECONDS = 30


@asynccontextmanager
async def lifespan(app: FastAPI):
    scheduler = AsyncIOScheduler()
    scheduler.add_job(
        poll_due_scheduled_items,
        trigger=IntervalTrigger(seconds=SCHEDULER_POLL_SECONDS),
        id="publishing_dispatch_poll",
        max_instances=1,
        coalesce=True,
        misfire_grace_time=30,
    )
    scheduler.start()
    app.state.scheduler = scheduler
    yield
    scheduler.shutdown(wait=False)


def create_app() -> FastAPI:
    """Build and configure the FastAPI application.

    Using a factory (rather than a bare module-level `app`) keeps room for
    later phases to conditionally wire routers, middleware, and startup
    hooks without reshaping this function's callers.
    """
    app = FastAPI(
        title="Content Agent AI Engine",
        description=(
            "FastAPI service owning research, RAG, generation, evaluation, "
            "channel adaptation, and publishing for the AI Content Research "
            "and Publishing Agent."
        ),
        version="0.1.0",
        lifespan=lifespan,
    )

    @app.get("/health")
    async def health() -> dict[str, str]:
        """Liveness check used by Phase 0 verification and later deploys."""
        return {"status": "ok"}

    app.include_router(pipeline_router)
    app.include_router(review_router)
    app.include_router(channels_router)
    app.include_router(publishing_router)
    app.include_router(intake_router)

    return app


# Convenience module-level instance so the app can also be run without
# `--factory` (e.g. `uvicorn app.main:app`). Prefer `create_app` directly in
# tests or when composition needs to happen before the app is built.
app = create_app()
