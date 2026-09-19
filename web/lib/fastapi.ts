const FASTAPI_BASE_URL = process.env.FASTAPI_BASE_URL ?? "http://localhost:8000";

export class FastApiError extends Error {}

type StartPipelineResponse = {
  research_job_id: string;
  status: string;
};

export async function startPipeline(
  requestId: string,
): Promise<StartPipelineResponse> {
  const res = await fetch(`${FASTAPI_BASE_URL}/pipeline/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ request_id: requestId }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new FastApiError(
      `FastAPI /pipeline/start failed (${res.status}): ${body}`,
    );
  }

  return res.json() as Promise<StartPipelineResponse>;
}

type DraftResponse = {
  id: string;
  version: number;
  title: string;
  body_markdown: string;
};

export async function requestRevision(
  draftId: string,
  note: string,
): Promise<DraftResponse> {
  const res = await fetch(`${FASTAPI_BASE_URL}/drafts/${draftId}/request-revision`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ note }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new FastApiError(
      `FastAPI /drafts/${draftId}/request-revision failed (${res.status}): ${body}`,
    );
  }

  return res.json() as Promise<DraftResponse>;
}

type AiAssistResponse = {
  title: string;
  body_markdown: string;
};

export async function aiAssistEdit(
  draftId: string,
  instruction: string,
): Promise<AiAssistResponse> {
  const res = await fetch(`${FASTAPI_BASE_URL}/drafts/${draftId}/ai-assist`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ instruction }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new FastApiError(
      `FastAPI /drafts/${draftId}/ai-assist failed (${res.status}): ${body}`,
    );
  }

  return res.json() as Promise<AiAssistResponse>;
}
