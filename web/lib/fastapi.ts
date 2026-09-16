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
