"""Database plumbing for the shared Supabase Postgres database.

Next.js/Drizzle owns the canonical schema migration (see TDD.md §3 and
BUILD-PLAN.md Phase 0), so this package does not define ORM models for the
full schema. It only provides the async SQLAlchemy engine/session plumbing
FastAPI needs to read and write the same tables starting in later phases
(research, drafts, evaluations, publishing queue, etc.).
"""
