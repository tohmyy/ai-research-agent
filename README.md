# Week 4: AI Content Research and Publishing Agent

This repo contains the Week 4 project brief, design docs, and the two-service application build.

## Docs

- `PRD.md`: the project brief
- `TDD.md`: technical design (architecture, data model, pipeline)
- `BUILD-PLAN.md`: the phased build plan
- `ui-design-spec.md`: UI design system and screen specs
- `assets/seo-best-practices.md`: SEO rules for article generation
- `assets/channel-formatting-rules.md`: formatting rules for LinkedIn, X, and email newsletter outputs
- `assets/content-evaluation-rubric.md`: evaluation criteria for the review and revision loop

Start with `PRD.md`, then `TDD.md` and `BUILD-PLAN.md` before touching code.

## Project layout

- `web/` — Next.js (TypeScript) app: UI, auth (Better Auth), and orchestration API routes.
- `api/` — FastAPI (Python) service: the AI engine and all outbound third-party integrations.
- `docker-compose.yml` — local Postgres with `pgvector` enabled, shared by both services in development.

## Local setup

1. Start Postgres: `docker compose up -d` (requires Docker Desktop).
2. Web app: `cd web`, copy `.env.example` to `.env`, `npm install`, `npm run db:push` to create the schema, then `npm run dev`.
3. API service: `cd api`, copy `.env.example` to `.env`, follow `api/README.md` (requires Python 3.11+).

Both services point `DATABASE_URL` at the same Postgres database (the local docker-compose instance in development, Supabase in production) — note the driver prefix differs per service: `postgresql://` for the web app's `postgres.js`/Drizzle client, `postgresql+asyncpg://` for the API's SQLAlchemy async engine.
