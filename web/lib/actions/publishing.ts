"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import {
  cancelSchedule,
  editSchedule,
  publishNow,
  retryPublish,
  schedulePublish,
  FastApiError,
} from "@/lib/fastapi";

async function requireUserId() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/login");
  }
  return session.user.id;
}

function toMessage(error: unknown): string {
  return error instanceof FastApiError ? error.message : "Unknown error";
}

export async function publishContentNow(channelContentId: string): Promise<void> {
  await requireUserId();
  try {
    await publishNow(channelContentId);
  } catch (error) {
    throw new Error(`Could not start publishing: ${toMessage(error)}`);
  }
  revalidatePath("/publishing");
  revalidatePath("/content-requests");
}

export async function scheduleContent(
  channelContentId: string,
  scheduledAt: string,
): Promise<void> {
  await requireUserId();
  try {
    await schedulePublish(channelContentId, scheduledAt);
  } catch (error) {
    throw new Error(`Could not schedule publishing: ${toMessage(error)}`);
  }
  revalidatePath("/publishing");
  revalidatePath("/content-requests");
}

export async function retryPublishing(queueId: string): Promise<void> {
  await requireUserId();
  try {
    await retryPublish(queueId);
  } catch (error) {
    throw new Error(`Could not retry publishing: ${toMessage(error)}`);
  }
  revalidatePath("/publishing");
  revalidatePath("/content-requests");
}

export async function editPublishSchedule(
  queueId: string,
  scheduledAt: string,
): Promise<void> {
  await requireUserId();
  try {
    await editSchedule(queueId, scheduledAt);
  } catch (error) {
    throw new Error(`Could not update schedule: ${toMessage(error)}`);
  }
  revalidatePath("/publishing");
  revalidatePath("/content-requests");
}

export async function cancelPublishing(queueId: string): Promise<void> {
  await requireUserId();
  try {
    await cancelSchedule(queueId);
  } catch (error) {
    throw new Error(`Could not cancel: ${toMessage(error)}`);
  }
  revalidatePath("/publishing");
  revalidatePath("/content-requests");
}
