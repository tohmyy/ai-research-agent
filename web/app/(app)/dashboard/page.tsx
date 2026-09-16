import Link from "next/link";
import { and, count, desc, eq, inArray, notInArray } from "drizzle-orm";
import { CalendarClock, ClipboardCheck, LayoutDashboard, Send } from "lucide-react";

import { db } from "@/lib/db";
import { contentRequests, publishingQueue } from "@/lib/db/schema";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

async function getSummary() {
  const [[active], [awaitingReview], [scheduled], [published], recent] =
    await Promise.all([
      db
        .select({ value: count() })
        .from(contentRequests)
        .where(notInArray(contentRequests.status, ["draft", "published", "failed"])),
      db
        .select({ value: count() })
        .from(contentRequests)
        .where(inArray(contentRequests.status, ["options_ready", "channel_review"])),
      db
        .select({ value: count() })
        .from(publishingQueue)
        .where(eq(publishingQueue.status, "scheduled")),
      db
        .select({ value: count() })
        .from(publishingQueue)
        .where(eq(publishingQueue.status, "published")),
      db
        .select()
        .from(contentRequests)
        .orderBy(desc(contentRequests.createdAt))
        .limit(5),
    ]);

  return {
    active: active.value,
    awaitingReview: awaitingReview.value,
    scheduled: scheduled.value,
    published: published.value,
    recent,
  };
}

function SummaryCard({
  label,
  value,
  description,
  icon: Icon,
}: {
  label: string;
  value: number;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card className="border-border bg-card shadow-subtle">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <span className="text-body text-muted-foreground">{label}</span>
        <Icon className="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="space-y-1">
        <p className="text-2xl leading-8 font-semibold tracking-[-0.02em]">
          {value}
        </p>
        <p className="text-caption text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

export default async function DashboardPage() {
  const { active, awaitingReview, scheduled, published, recent } =
    await getSummary();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Content Dashboard"
        description="Overview of your content pipeline and publishing activity."
        action={
          <Button asChild>
            <Link href="/content-requests/new">New Content Request</Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          label="Active Requests"
          value={active}
          description="Content currently being processed"
          icon={LayoutDashboard}
        />
        <SummaryCard
          label="Awaiting Review"
          value={awaitingReview}
          description="Waiting on a human decision"
          icon={ClipboardCheck}
        />
        <SummaryCard
          label="Scheduled"
          value={scheduled}
          description="Queued for future publishing"
          icon={CalendarClock}
        />
        <SummaryCard
          label="Published"
          value={published}
          description="Live across your channels"
          icon={Send}
        />
      </div>

      <section className="space-y-4">
        <h2 className="text-section-title font-semibold tracking-[-0.01em]">
          Recent Content Requests
        </h2>

        {recent.length === 0 ? (
          <EmptyState
            icon={LayoutDashboard}
            title="No content requests yet."
            description="Start your first content request to begin researching and generating content."
            action={
              <Button asChild>
                <Link href="/content-requests/new">New Content Request</Link>
              </Button>
            }
          />
        ) : (
          <div className="space-y-3">
            {recent.map((request) => (
              <Link key={request.id} href={`/content-requests/${request.id}`}>
                <Card className="border-border bg-card shadow-subtle transition-colors duration-150 hover:bg-muted">
                  <CardContent className="flex items-center justify-between gap-4 py-4">
                    <div className="min-w-0 space-y-1">
                      <p className="truncate text-body-medium">{request.rawIdea}</p>
                      <p className="truncate text-caption text-muted-foreground">
                        {request.targetAudience}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-4">
                      <span className="text-caption text-muted-foreground">
                        {formatDate(request.createdAt)}
                      </span>
                      <StatusBadge status={request.status} />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
