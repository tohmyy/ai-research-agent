import Link from "next/link";
import { desc, inArray } from "drizzle-orm";
import { Search } from "lucide-react";

import { db } from "@/lib/db";
import { contentRequests } from "@/lib/db/schema";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent } from "@/components/ui/card";

const RESEARCH_STATUSES = ["submitted", "researching", "research_complete", "failed"];

export default async function ResearchPage() {
  const requests = await db
    .select()
    .from(contentRequests)
    .where(inArray(contentRequests.status, RESEARCH_STATUSES))
    .orderBy(desc(contentRequests.createdAt))
    .limit(50);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Research"
        description="Sources gathered for content currently in progress."
      />

      {requests.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No research activity yet."
          description="Research begins automatically once a content request is submitted."
        />
      ) : (
        <div className="space-y-3">
          {requests.map((request) => (
            <Link key={request.id} href={`/content-requests/${request.id}`}>
              <Card className="border-border bg-card shadow-subtle transition-colors duration-150 hover:bg-muted">
                <CardContent className="flex items-center justify-between gap-4 py-4">
                  <div className="min-w-0 space-y-1">
                    <p className="truncate text-body-medium">{request.rawIdea}</p>
                    <p className="truncate text-caption text-muted-foreground">
                      {request.targetAudience}
                    </p>
                  </div>
                  <StatusBadge status={request.status} />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
