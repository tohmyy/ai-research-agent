"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, desc, eq, inArray } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  approvals,
  articleDrafts,
  channelConfigs,
  channelContent,
  contentRequests,
  draftSources,
} from "@/lib/db/schema";
import {
  aiAssistEdit,
  parseIntakePrompt,
  requestRevision,
  requestChannelRevision,
  startChannelAdaptation,
  startPipeline,
  FastApiError,
  type ParseIntakeResponse,
} from "@/lib/fastapi";

export type ContentRequestFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

export type ParseIntakeResult =
  | { ok: true; fields: ParseIntakeResponse }
  | { ok: false; error: string };

export async function parseIntake(prompt: string): Promise<ParseIntakeResult> {
  await requireUserId();
  const trimmed = prompt.trim();
  if (!trimmed) {
    return { ok: false, error: "Describe what you want to create." };
  }

  try {
    const fields = await parseIntakePrompt(trimmed);
    return { ok: true, fields };
  } catch (error) {
    const message =
      error instanceof FastApiError ? error.message : "Unknown error";
    return { ok: false, error: `Could not categorize your request: ${message}` };
  }
}

async function requireUserId() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/login");
  }
  return session.user.id;
}

function parseForm(formData: FormData) {
  const rawIdea = String(formData.get("rawIdea") ?? "").trim();
  const targetAudience = String(formData.get("targetAudience") ?? "").trim();
  const supportingMaterial = String(
    formData.get("supportingMaterial") ?? "",
  ).trim();
  const sourceUrl = String(formData.get("sourceUrl") ?? "").trim();
  const additionalInstructions = String(
    formData.get("additionalInstructions") ?? "",
  ).trim();

  const fieldErrors: Record<string, string> = {};

  if (!rawIdea) {
    fieldErrors.rawIdea = "Describe the content idea.";
  }
  if (!targetAudience) {
    fieldErrors.targetAudience = "Describe who this content is for.";
  }
  if (sourceUrl) {
    try {
      new URL(sourceUrl);
    } catch {
      fieldErrors.sourceUrl = "Enter a valid URL, including https://.";
    }
  }

  return {
    values: {
      rawIdea,
      targetAudience,
      supportingMaterial,
      sourceUrl,
      additionalInstructions,
    },
    fieldErrors,
  };
}

export async function saveDraft(
  _prevState: ContentRequestFormState,
  formData: FormData,
): Promise<ContentRequestFormState> {
  const userId = await requireUserId();
  const { values, fieldErrors } = parseForm(formData);

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  await db.insert(contentRequests).values({
    rawIdea: values.rawIdea,
    targetAudience: values.targetAudience,
    supportingMaterial: values.supportingMaterial || null,
    sourceUrl: values.sourceUrl || null,
    additionalInstructions: values.additionalInstructions || null,
    status: "draft",
    createdBy: userId,
  });

  revalidatePath("/content-requests");
  revalidatePath("/dashboard");
  redirect("/content-requests");
}

export async function retryResearch(requestId: string): Promise<void> {
  await requireUserId();

  await db
    .update(contentRequests)
    .set({ status: "researching", updatedAt: new Date() })
    .where(eq(contentRequests.id, requestId));

  try {
    await startPipeline(requestId);
  } catch (error) {
    const message =
      error instanceof FastApiError ? error.message : "Unknown error";
    await db
      .update(contentRequests)
      .set({ status: "failed", updatedAt: new Date() })
      .where(eq(contentRequests.id, requestId));
    throw new Error(`Could not restart research: ${message}`);
  }

  revalidatePath(`/content-requests/${requestId}`);
  revalidatePath("/content-requests");
  revalidatePath("/dashboard");
}

/** Retries channel adaptation after it failed — used by `ResearchFailure`
 * when `research_jobs.stage === 'adapting_channels'`. Unlike `retryResearch`
 * (which restarts the whole pipeline), this resumes the correct stage: a
 * channel-adaptation failure means an article is already approved, and
 * restarting research from scratch would orphan it and eventually generate
 * unrelated new options. This re-triggers adaptation for whatever channels
 * are currently enabled in Settings — a documented simplification, since
 * if some channels already succeeded before one failed mid-run, the exact
 * original selection isn't preserved anywhere to reconstruct perfectly. */
export async function retryChannelAdaptation(requestId: string): Promise<void> {
  await requireUserId();

  const [draft] = await db
    .select({ id: articleDrafts.id })
    .from(articleDrafts)
    .where(
      and(eq(articleDrafts.requestId, requestId), eq(articleDrafts.status, "approved")),
    )
    .orderBy(desc(articleDrafts.version))
    .limit(1);
  if (!draft) {
    throw new Error("Could not find the approved article for this request.");
  }

  const enabledChannelRows = await db
    .select({ channel: channelConfigs.channel })
    .from(channelConfigs)
    .where(eq(channelConfigs.enabled, true));
  const channels = enabledChannelRows.map((r) => r.channel);
  if (channels.length === 0) {
    throw new Error("No channels are enabled — configure one in Settings before retrying.");
  }

  await db
    .update(contentRequests)
    .set({ status: "channel_adapting", updatedAt: new Date() })
    .where(eq(contentRequests.id, requestId));

  try {
    await startChannelAdaptation(requestId, draft.id, channels);
  } catch (error) {
    const message =
      error instanceof FastApiError ? error.message : "Unknown error";
    await db
      .update(contentRequests)
      .set({ status: "failed", updatedAt: new Date() })
      .where(eq(contentRequests.id, requestId));
    throw new Error(`Could not restart channel adaptation: ${message}`);
  }

  revalidatePath(`/content-requests/${requestId}`);
  revalidatePath("/content-requests");
  revalidatePath("/dashboard");
}

export async function startResearch(
  _prevState: ContentRequestFormState,
  formData: FormData,
): Promise<ContentRequestFormState> {
  const userId = await requireUserId();
  const { values, fieldErrors } = parseForm(formData);

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const [created] = await db
    .insert(contentRequests)
    .values({
      rawIdea: values.rawIdea,
      targetAudience: values.targetAudience,
      supportingMaterial: values.supportingMaterial || null,
      sourceUrl: values.sourceUrl || null,
      additionalInstructions: values.additionalInstructions || null,
      status: "submitted",
      createdBy: userId,
    })
    .returning({ id: contentRequests.id });

  try {
    await startPipeline(created.id);
    await db
      .update(contentRequests)
      .set({ status: "researching", updatedAt: new Date() })
      .where(eq(contentRequests.id, created.id));
  } catch (error) {
    const message =
      error instanceof FastApiError ? error.message : "Unknown error";
    await db
      .update(contentRequests)
      .set({ status: "failed", updatedAt: new Date() })
      .where(eq(contentRequests.id, created.id));
    return { error: `Could not start research: ${message}` };
  }

  revalidatePath("/content-requests");
  revalidatePath("/dashboard");
  redirect(`/content-requests/${created.id}`);
}

export async function selectArticle(
  requestId: string,
  draftId: string,
): Promise<void> {
  await requireUserId();

  // Reject only the *other* options' current (highest-version) draft —
  // never a superseded pre-revision version, including the chosen option's
  // own history, which should stay whatever it was, not "rejected."
  const allDrafts = await db
    .select({
      id: articleDrafts.id,
      variantLabel: articleDrafts.variantLabel,
      version: articleDrafts.version,
    })
    .from(articleDrafts)
    .where(eq(articleDrafts.requestId, requestId));

  const currentByVariant = new Map<string, { id: string; version: number }>();
  for (const draft of allDrafts) {
    const key = draft.variantLabel ?? draft.id;
    const current = currentByVariant.get(key);
    if (!current || draft.version > current.version) {
      currentByVariant.set(key, { id: draft.id, version: draft.version });
    }
  }
  const otherCurrentIds = [...currentByVariant.values()]
    .map((v) => v.id)
    .filter((id) => id !== draftId);

  await db
    .update(articleDrafts)
    .set({ status: "selected", updatedAt: new Date() })
    .where(eq(articleDrafts.id, draftId));

  if (otherCurrentIds.length > 0) {
    await db
      .update(articleDrafts)
      .set({ status: "rejected", updatedAt: new Date() })
      .where(inArray(articleDrafts.id, otherCurrentIds));
  }

  await db
    .update(contentRequests)
    .set({ status: "selected", updatedAt: new Date() })
    .where(eq(contentRequests.id, requestId));

  revalidatePath(`/content-requests/${requestId}`);
  revalidatePath("/content-requests");
  revalidatePath("/dashboard");
}

export async function approveArticle(
  requestId: string,
  draftId: string,
  channels: string[],
  notes?: string,
): Promise<void> {
  const userId = await requireUserId();

  await db.insert(approvals).values({
    targetType: "article",
    targetId: draftId,
    decision: "approve",
    reviewerId: userId,
    notes: notes || null,
  });

  await db
    .update(articleDrafts)
    .set({ status: "approved", updatedAt: new Date() })
    .where(eq(articleDrafts.id, draftId));

  if (channels.length === 0) {
    // No channels selected (or none configured) — approve the article and
    // stop there, same as the pre-channel-adaptation behavior. Nothing to
    // adapt for, so content_requests stays "approved" rather than moving
    // into a channel pipeline that has nothing to do.
    await db
      .update(contentRequests)
      .set({ status: "approved", updatedAt: new Date() })
      .where(eq(contentRequests.id, requestId));

    revalidatePath(`/content-requests/${requestId}`);
    revalidatePath("/review");
    revalidatePath("/dashboard");
    return;
  }

  await db
    .update(contentRequests)
    .set({ status: "channel_adapting", updatedAt: new Date() })
    .where(eq(contentRequests.id, requestId));

  try {
    await startChannelAdaptation(requestId, draftId, channels);
  } catch (error) {
    const message =
      error instanceof FastApiError ? error.message : "Unknown error";
    await db
      .update(contentRequests)
      .set({ status: "failed", updatedAt: new Date() })
      .where(eq(contentRequests.id, requestId));
    throw new Error(`Could not start channel adaptation: ${message}`);
  }

  revalidatePath(`/content-requests/${requestId}`);
  revalidatePath("/review");
  revalidatePath("/dashboard");
}

export async function rejectArticle(
  requestId: string,
  draftId: string,
  notes: string,
): Promise<void> {
  const userId = await requireUserId();

  await db.insert(approvals).values({
    targetType: "article",
    targetId: draftId,
    decision: "reject",
    reviewerId: userId,
    notes,
  });

  await db
    .update(articleDrafts)
    .set({ status: "rejected", updatedAt: new Date() })
    .where(eq(articleDrafts.id, draftId));

  await db
    .update(contentRequests)
    .set({ status: "rejected", updatedAt: new Date() })
    .where(eq(contentRequests.id, requestId));

  revalidatePath(`/content-requests/${requestId}`);
  revalidatePath("/review");
  revalidatePath("/dashboard");
}

export async function requestArticleRevision(
  requestId: string,
  draftId: string,
  notes: string,
): Promise<void> {
  const userId = await requireUserId();

  await db.insert(approvals).values({
    targetType: "article",
    targetId: draftId,
    decision: "revise",
    reviewerId: userId,
    notes,
  });

  await requestRevision(draftId, notes);

  revalidatePath(`/content-requests/${requestId}`);
}

async function copyDraftSources(fromDraftId: string, toDraftId: string) {
  const rows = await db
    .select({ sourceId: draftSources.sourceId, chunkIds: draftSources.chunkIds })
    .from(draftSources)
    .where(eq(draftSources.draftId, fromDraftId));

  for (const row of rows) {
    await db.insert(draftSources).values({
      draftId: toDraftId,
      sourceId: row.sourceId,
      chunkIds: row.chunkIds,
    });
  }
}

/** Persists a new draft version — used by both a manual editor save and an
 * accepted AI Assistant suggestion (see Phase 5 plan: same operation
 * either way, so one code path). */
export async function saveDraftRevision(
  requestId: string,
  currentDraftId: string,
  title: string,
  bodyMarkdown: string,
): Promise<void> {
  await requireUserId();

  const [current] = await db
    .select()
    .from(articleDrafts)
    .where(eq(articleDrafts.id, currentDraftId))
    .limit(1);
  if (!current) {
    throw new Error("Draft not found");
  }

  const [created] = await db
    .insert(articleDrafts)
    .values({
      requestId,
      version: current.version + 1,
      parentDraftId: current.id,
      variantLabel: current.variantLabel,
      title,
      bodyMarkdown,
      // Carries forward whatever the edited draft's status was (almost
      // always "selected", since editing only happens while under
      // review) — the new version replaces it as "the current one", and
      // page.tsx's fallback lookup for the reviewed option depends on
      // finding a leaf draft with status "selected" before any
      // approvals row exists yet.
      status: current.status,
      revisionSource: "human_edit",
    })
    .returning({ id: articleDrafts.id });

  await copyDraftSources(current.id, created!.id);

  revalidatePath(`/content-requests/${requestId}`);
}

export async function approveChannelContent(
  requestId: string,
  channelContentId: string,
  notes?: string,
): Promise<void> {
  const userId = await requireUserId();

  await db.insert(approvals).values({
    targetType: "channel_content",
    targetId: channelContentId,
    decision: "approve",
    reviewerId: userId,
    notes: notes || null,
  });

  await db
    .update(channelContent)
    .set({ status: "approved", updatedAt: new Date() })
    .where(eq(channelContent.id, channelContentId));

  revalidatePath(`/content-requests/${requestId}`);
  revalidatePath("/review");
  revalidatePath("/dashboard");
}

export async function rejectChannelContent(
  requestId: string,
  channelContentId: string,
  notes: string,
): Promise<void> {
  const userId = await requireUserId();

  await db.insert(approvals).values({
    targetType: "channel_content",
    targetId: channelContentId,
    decision: "reject",
    reviewerId: userId,
    notes,
  });

  await db
    .update(channelContent)
    .set({ status: "rejected", updatedAt: new Date() })
    .where(eq(channelContent.id, channelContentId));

  revalidatePath(`/content-requests/${requestId}`);
  revalidatePath("/review");
  revalidatePath("/dashboard");
}

export async function requestChannelContentRevision(
  requestId: string,
  channelContentId: string,
  notes: string,
): Promise<void> {
  const userId = await requireUserId();

  await db.insert(approvals).values({
    targetType: "channel_content",
    targetId: channelContentId,
    decision: "revise",
    reviewerId: userId,
    notes,
  });

  await requestChannelRevision(channelContentId, notes);

  revalidatePath(`/content-requests/${requestId}`);
}

/** Persists a new channel_content version — a plain manual edit, no AI
 * assistant for channel content (Phase 6 scope: backlogged). */
export async function saveChannelContentEdit(
  requestId: string,
  currentContentId: string,
  subject: string | null,
  body: string,
): Promise<void> {
  await requireUserId();

  const [current] = await db
    .select()
    .from(channelContent)
    .where(eq(channelContent.id, currentContentId))
    .limit(1);
  if (!current) {
    throw new Error("Channel content not found");
  }

  await db.insert(channelContent).values({
    draftId: current.draftId,
    channel: current.channel,
    version: current.version + 1,
    parentContentId: current.id,
    // Carries forward the edited content's status (almost always
    // "evaluated", since editing only happens during review) — the new
    // version replaces it as the current one under review.
    status: current.status,
    revisionSource: "human_edit",
    subject,
    body,
  });

  revalidatePath(`/content-requests/${requestId}`);
}

export async function proposeAiAssistEdit(
  draftId: string,
  instruction: string,
): Promise<{ title: string; bodyMarkdown: string }> {
  await requireUserId();

  const result = await aiAssistEdit(draftId, instruction);
  return { title: result.title, bodyMarkdown: result.body_markdown };
}
