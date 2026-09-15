-- Runs automatically on first container start (docker-entrypoint-initdb.d).
-- Supabase enables this extension by default; local Postgres needs it explicitly.
CREATE EXTENSION IF NOT EXISTS vector;
