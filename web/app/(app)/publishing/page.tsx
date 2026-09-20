import { Send } from "lucide-react";
import { asc, eq, inArray, or } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  articleDrafts,
  channelContent,
  contentRequests,
  publishingQueue,
} from "@/lib/db/schema";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { PublishingQueueTable, type PublishingQueueRow } from "@/components/publishing/publishing-queue-table";

export default async function PublishingPage() {
  const approvedContent = await db
    .select({
      contentId: channelContent.id,
      channel: channelContent.channel,
      subject: channelContent.subject,
      body: channelContent.body,
      requestId: contentRequests.id,
      rawIdea: contentRequests.rawIdea,
      createdAt: channelContent.createdAt,
    })
    .from(channelContent)
    .innerJoin(articleDrafts, eq(articleDrafts.id, channelContent.draftId))
    .innerJoin(contentRequests, eq(contentRequests.id, articleDrafts.requestId))
    .where(
      or(
        eq(channelContent.status, "approved"),
        inArray(
          channelContent.id,
          db.select({ id: publishingQueue.channelContentId }).from(publishingQueue),
        ),
      ),
    );

  const contentIds = approvedContent.map((c) => c.contentId);
  const queueRows = contentIds.length
    ? await db
        .select()
        .from(publishingQueue)
        .where(inArray(publishingQueue.channelContentId, contentIds))
        .orderBy(asc(publishingQueue.createdAt))
    : [];

  const queueByContentId = new Map<string, (typeof queueRows)[number]>();
  for (const row of queueRows) {
    queueByContentId.set(row.channelContentId, row);
  }

  const rows: PublishingQueueRow[] = approvedContent.map((content) => {
    const queue = queueByContentId.get(content.contentId) ?? null;
    return {
      contentId: content.contentId,
      channel: content.channel as PublishingQueueRow["channel"],
      contentPreview: content.subject || content.body || "",
      requestId: content.requestId,
      rawIdea: content.rawIdea,
      createdAt: content.createdAt,
      queue: queue
        ? {
            id: queue.id,
            status: queue.status,
            scheduledAt: queue.scheduledAt,
            publishedAt: queue.publishedAt,
            externalPostId: queue.externalPostId,
            error: queue.error,
          }
        : null,
    };
  });

  return (
    <div className="space-y-8">
      <PageHeader
        title="Publishing"
        description="Approved content that is queued, scheduled, or published."
      />

      {rows.length === 0 ? (
        <EmptyState
          icon={Send}
          title="Publishing queue is empty."
          description="Approved content will appear here, ready to publish or schedule."
        />
      ) : (
        <PublishingQueueTable rows={rows} />
      )}
    </div>
  );
}
