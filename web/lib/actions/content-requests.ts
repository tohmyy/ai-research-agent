"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq, inArray } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { approvals, articleDrafts, contentRequests, draftSources } from "@/lib/db/schema";
import { aiAssistEdit, requestRevision, startPipeline, FastApiError } from "@/lib/fastapi";

export type ContentRequestFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

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

  await db
    .update(contentRequests)
    .set({ status: "approved", updatedAt: new Date() })
    .where(eq(contentRequests.id, requestId));

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

export async function proposeAiAssistEdit(
  draftId: string,
  instruction: string,
): Promise<{ title: string; bodyMarkdown: string }> {
  await requireUserId();

  const result = await aiAssistEdit(draftId, instruction);
  return { title: result.title, bodyMarkdown: result.body_markdown };
}
