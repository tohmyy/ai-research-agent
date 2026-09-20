import Link from "next/link";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import { PublishActions } from "./publish-actions";
import type { PublishQueueInfo } from "@/components/content-requests/types";

export type PublishingQueueRow = {
  contentId: string;
  channel: "linkedin" | "x" | "newsletter";
  contentPreview: string;
  requestId: string;
  rawIdea: string;
  createdAt: Date;
  queue: PublishQueueInfo | null;
};

const CHANNEL_LABELS: Record<string, string> = {
  linkedin: "LinkedIn",
  x: "X",
  newsletter: "Newsletter",
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function PublishingQueueTable({ rows }: { rows: PublishingQueueRow[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Content</TableHead>
            <TableHead>Channel</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Scheduled</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.contentId}>
              <TableCell className="max-w-[280px]">
                <Link
                  href={`/content-requests/${row.requestId}`}
                  className="line-clamp-1 font-medium text-foreground hover:underline"
                >
                  {row.rawIdea}
                </Link>
                <p className="line-clamp-1 text-caption text-muted-foreground">
                  {row.contentPreview}
                </p>
              </TableCell>
              <TableCell>{CHANNEL_LABELS[row.channel] ?? row.channel}</TableCell>
              <TableCell>
                <StatusBadge status={row.queue?.status ?? "approved"} />
              </TableCell>
              <TableCell className="text-caption text-muted-foreground">
                {row.queue?.scheduledAt ? formatDate(row.queue.scheduledAt) : "—"}
              </TableCell>
              <TableCell className="text-caption text-muted-foreground">
                {formatDate(row.createdAt)}
              </TableCell>
              <TableCell>
                <div className="flex justify-end">
                  <PublishActions
                    channelContentId={row.contentId}
                    channel={row.channel}
                    contentPreview={row.contentPreview}
                    queue={row.queue}
                  />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
