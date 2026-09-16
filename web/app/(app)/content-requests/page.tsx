import Link from "next/link";
import { desc } from "drizzle-orm";
import { FileText } from "lucide-react";

import { db } from "@/lib/db";
import { contentRequests } from "@/lib/db/schema";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

export default async function ContentRequestsPage() {
  const requests = await db
    .select()
    .from(contentRequests)
    .orderBy(desc(contentRequests.createdAt))
    .limit(50);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Content Requests"
        description="Every idea or source submitted for research and drafting."
        action={
          <Button asChild>
            <Link href="/content-requests/new">New Content Request</Link>
          </Button>
        }
      />

      {requests.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No content requests yet."
          description="Start your first content request to begin researching and generating content."
          action={
            <Button asChild>
              <Link href="/content-requests/new">New Content Request</Link>
            </Button>
          }
        />
      ) : (
        <div className="rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Idea</TableHead>
                <TableHead>Target Audience</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="max-w-sm truncate font-medium">
                    {request.rawIdea}
                  </TableCell>
                  <TableCell className="max-w-xs truncate text-muted-foreground">
                    {request.targetAudience}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={request.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(request.createdAt)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(request.updatedAt)}
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
