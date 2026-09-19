"""FastAPI application entrypoint.

Phase 0 scope: expose a health check and set up the app factory pattern so
later phases (research, generation, evaluation, channel adaptation,
publishing — see BUILD-PLAN.md) have an obvious place to register routers.
No pipeline logic is implemented here yet.
"""
from fastapi import FastAPI

from app.pipeline.router import router as pipeline_router
from app.review.router import router as review_router


def create_app() -> FastAPI:
    """Build and configure the FastAPI application.

    Using a factory (rather than a bare module-level `app`) keeps room for
    later phases to conditionally wire routers, middleware, and startup
    hooks (e.g. the APScheduler instance from TDD.md §8) without reshaping
    this function's callers.
    """
    app = FastAPI(
        title="Content Agent AI Engine",
        description=(
            "FastAPI service owning research, RAG, generation, evaluation, "
            "channel adaptation, and publishing for the AI Content Research "
            "and Publishing Agent."
        ),
        version="0.1.0",
    )

    @app.get("/health")
    async def health() -> dict[str, str]:
        """Liveness check used by Phase 0 verification and later deploys."""
        return {"status": "ok"}

    app.include_router(pipeline_router)
    app.include_router(review_router)

    return app


# Convenience module-level instance so the app can also be run without
# `--factory` (e.g. `uvicorn app.main:app`). Prefer `create_app` directly in
# tests or when composition needs to happen before the app is built.
app = create_app()
