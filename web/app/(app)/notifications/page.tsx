import { Bell } from "lucide-react";
import { desc, eq, inArray } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  channelContent,
  contentRequests,
  notifications,
  publishingQueue,
} from "@/lib/db/schema";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import { ErrorDetails } from "@/components/publishing/error-details";

const TYPE_LABELS: Record<string, string> = {
  review_ready: "Review Ready",
  published: "Published",
  publish_failed: "Publish Failed",
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export default async function NotificationsPage() {
  const rows = await db
    .select()
    .from(notifications)
    .orderBy(desc(notifications.createdAt))
    .limit(100);

  const requestIds = rows
    .filter((r) => r.type === "review_ready" && r.targetId)
    .map((r) => r.targetId!);
  const queueIds = rows
    .filter((r) => r.type !== "review_ready" && r.targetId)
    .map((r) => r.targetId!);

  const requestLabels = new Map<string, string>();
  if (requestIds.length > 0) {
    const requestRows = await db
      .select({ id: contentRequests.id, rawIdea: contentRequests.rawIdea })
      .from(contentRequests)
      .where(inArray(contentRequests.id, requestIds));
    for (const r of requestRows) requestLabels.set(r.id, r.rawIdea);
  }

  const queueLabels = new Map<string, string>();
  if (queueIds.length > 0) {
    const queueRows = await db
      .select({
        id: publishingQueue.id,
        channel: publishingQueue.channel,
        subject: channelContent.subject,
        body: channelContent.body,
      })
      .from(publishingQueue)
      .innerJoin(channelContent, eq(channelContent.id, publishingQueue.channelContentId))
      .where(inArray(publishingQueue.id, queueIds));
    for (const r of queueRows) {
      queueLabels.set(r.id, `${r.channel} — ${r.subject || (r.body || "").slice(0, 40)}`);
    }
  }

  function targetLabel(row: (typeof rows)[number]): string {
    if (!row.targetId) return "—";
    if (row.type === "review_ready") {
      return requestLabels.get(row.targetId) ?? row.targetId;
    }
    return queueLabels.get(row.targetId) ?? row.targetId;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Notifications"
        description="Every review-ready, published, and publish-failed email attempt, whether it sent or not."
      />

      {rows.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications yet."
          description="Notification send attempts will appear here."
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Error</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{TYPE_LABELS[row.type] ?? row.type}</TableCell>
                  <TableCell className="max-w-[320px] truncate">{targetLabel(row)}</TableCell>
                  <TableCell>
                    <StatusBadge status={row.sentAt ? "published" : "failed"} />
                  </TableCell>
                  <TableCell className="max-w-[360px]">
                    {row.error ? <ErrorDetails error={row.error} /> : "—"}
                  </TableCell>
                  <TableCell className="text-caption text-muted-foreground">
                    {formatDate(row.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
