"""Simple paragraph-aware text chunking for embedding."""
from __future__ import annotations

TARGET_CHUNK_SIZE = 800
OVERLAP = 100


def chunk_text(text: str, target_size: int = TARGET_CHUNK_SIZE, overlap: int = OVERLAP) -> list[str]:
    """Split text into ~target_size-character chunks, breaking on paragraphs
    where possible so chunks stay coherent rather than cutting mid-sentence.
    """
    paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
    if not paragraphs:
        return []

    chunks: list[str] = []
    current = ""

    for paragraph in paragraphs:
        candidate = f"{current}\n\n{paragraph}" if current else paragraph
        if len(candidate) <= target_size:
            current = candidate
            continue

        if current:
            chunks.append(current)
        # A single paragraph longer than target_size is split on its own.
        if len(paragraph) > target_size:
            for start in range(0, len(paragraph), target_size - overlap):
                chunks.append(paragraph[start : start + target_size])
            current = ""
        else:
            current = paragraph

    if current:
        chunks.append(current)

    return chunks
