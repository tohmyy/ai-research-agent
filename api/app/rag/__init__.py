"""Retrieval-augmented generation (RAG) stage.

Chunks source text, generates Voyage AI embeddings, stores them in
`source_chunks.embedding` (pgvector), and performs similarity search to
build the context passed to Claude for planning and drafting.

Implemented in Phase 2 (storage) and exercised starting in Phase 3
(retrieval) — see BUILD-PLAN.md. No logic lives here yet.
"""
