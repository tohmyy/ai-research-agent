"""Intake endpoints — free-text prompt categorization."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.generation.claude_client import GenerationError
from app.intake.parse import parse_prompt

router = APIRouter(prefix="/intake", tags=["intake"])


class ParseIntakeRequest(BaseModel):
    prompt: str = Field(min_length=1)


class ParseIntakeResponse(BaseModel):
    raw_idea: str
    target_audience: str
    supporting_material: str
    source_url: str
    additional_instructions: str


@router.post("/parse", response_model=ParseIntakeResponse)
async def parse_intake(payload: ParseIntakeRequest) -> ParseIntakeResponse:
    prompt = payload.prompt.strip()
    if not prompt:
        raise HTTPException(status_code=400, detail="prompt must not be empty")

    try:
        fields = parse_prompt(prompt)
    except GenerationError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    return ParseIntakeResponse(**fields)
