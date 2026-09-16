"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { contentRequests } from "@/lib/db/schema";
import { startPipeline, FastApiError } from "@/lib/fastapi";

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
  redirect("/content-requests");
}
