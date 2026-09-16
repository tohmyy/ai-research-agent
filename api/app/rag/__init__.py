"""Retrieval-augmented generation (RAG) stage.

Chunks source text, generates Voyage AI embeddings, stores them in
`source_chunks.embedding` (pgvector), and performs similarity search to
build the context passed to Claude for planning and drafting.

See `chunking.py`, `embeddings.py`, and `retrieval.py` (pgvector
similarity search, shared by Phase 2's relevance ranking and Phase 3's
context-building).
"""
