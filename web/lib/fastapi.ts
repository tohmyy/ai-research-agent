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

type AdaptChannelsResponse = {
  research_job_id: string;
  status: string;
};

export async function startChannelAdaptation(
  requestId: string,
  draftId: string,
  channels: string[],
): Promise<AdaptChannelsResponse> {
  const res = await fetch(`${FASTAPI_BASE_URL}/pipeline/adapt-channels`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ request_id: requestId, draft_id: draftId, channels }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new FastApiError(
      `FastAPI /pipeline/adapt-channels failed (${res.status}): ${body}`,
    );
  }

  return res.json() as Promise<AdaptChannelsResponse>;
}

type ChannelContentResponse = {
  id: string;
  version: number;
  subject: string | null;
  body: string;
};

export async function requestChannelRevision(
  channelContentId: string,
  note: string,
): Promise<ChannelContentResponse> {
  const res = await fetch(
    `${FASTAPI_BASE_URL}/channel-content/${channelContentId}/request-revision`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note }),
    },
  );

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new FastApiError(
      `FastAPI /channel-content/${channelContentId}/request-revision failed (${res.status}): ${body}`,
    );
  }

  return res.json() as Promise<ChannelContentResponse>;
}

export type QueueItemResponse = {
  id: string;
  channel_content_id: string;
  channel: string;
  status: string;
  scheduled_at: string | null;
  published_at: string | null;
  external_post_id: string | null;
  error: string | null;
};

async function publishingRequest(
  path: string,
  init: RequestInit,
): Promise<QueueItemResponse> {
  const res = await fetch(`${FASTAPI_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new FastApiError(`FastAPI ${path} failed (${res.status}): ${body}`);
  }

  return res.json() as Promise<QueueItemResponse>;
}

export function publishNow(channelContentId: string): Promise<QueueItemResponse> {
  return publishingRequest(`/publishing/${channelContentId}/publish-now`, {
    method: "POST",
  });
}

export function schedulePublish(
  channelContentId: string,
  scheduledAt: string,
): Promise<QueueItemResponse> {
  return publishingRequest(`/publishing/${channelContentId}/schedule`, {
    method: "POST",
    body: JSON.stringify({ scheduled_at: scheduledAt }),
  });
}

export function retryPublish(queueId: string): Promise<QueueItemResponse> {
  return publishingRequest(`/publishing/queue/${queueId}/retry`, {
    method: "POST",
  });
}

export function editSchedule(
  queueId: string,
  scheduledAt: string,
): Promise<QueueItemResponse> {
  return publishingRequest(`/publishing/queue/${queueId}/schedule`, {
    method: "PATCH",
    body: JSON.stringify({ scheduled_at: scheduledAt }),
  });
}

export function cancelSchedule(queueId: string): Promise<QueueItemResponse> {
  return publishingRequest(`/publishing/queue/${queueId}/cancel`, {
    method: "POST",
  });
}
