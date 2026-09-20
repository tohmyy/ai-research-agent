"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { channelConfigs } from "@/lib/db/schema";

async function requireUserId() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/login");
  }
  return session.user.id;
}

export async function saveChannelConfig(
  channel: string,
  enabled: boolean,
  config: Record<string, string>,
): Promise<void> {
  await requireUserId();

  await db
    .update(channelConfigs)
    .set({ enabled, config, updatedAt: new Date() })
    .where(eq(channelConfigs.channel, channel));

  revalidatePath("/settings");
  revalidatePath("/content-requests");
}
