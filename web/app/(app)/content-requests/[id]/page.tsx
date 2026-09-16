import { notFound } from "next/navigation";
import { desc, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { contentRequests, researchJobs, sources } from "@/lib/db/schema";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { ActivityTimeline, type TimelineStep } from "@/components/research/activity-timeline";
import { SourceExplorer } from "@/components/research/source-explorer";
import { ResearchFailure } from "@/components/research/research-failure";
import { LiveRefresh } from "@/components/research/live-refresh";

const IN_PROGRESS_STATUSES = new Set(["submitted", "researching"]);

export default async function ContentRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [request] = await db
    .select()
    .from(contentRequests)
    .where(eq(contentRequests.id, id))
    .limit(1);

  if (!request) {
    notFound();
  }

  const [job] = await db
    .select()
    .from(researchJobs)
    .where(eq(researchJobs.requestId, id))
    .orderBy(desc(researchJobs.createdAt))
    .limit(1);

  const requestSources = await db
    .select()
    .from(sources)
    .where(eq(sources.requestId, id))
    .orderBy(desc(sources.relevanceScore));

  const steps = (job?.steps as TimelineStep[] | null) ?? [];
  const inProgress = IN_PROGRESS_STATUSES.has(request.status);

  return (
    <div className="space-y-8">
      <LiveRefresh active={inProgress} />

      <PageHeader
        title={request.rawIdea}
        description={`For: ${request.targetAudience}`}
        action={<StatusBadge status={request.status} />}
      />

      {request.status === "failed" ? (
        <ResearchFailure requestId={request.id} error={job?.error ?? null} />
      ) : (
        <>
          {steps.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-section-title font-semibold tracking-[-0.01em]">
                {inProgress ? "Researching" : "Research"}
              </h2>
              <ActivityTimeline steps={steps} showUpcoming={inProgress} />
            </section>
          )}

          {requestSources.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-section-title font-semibold tracking-[-0.01em]">
                Sources
              </h2>
              <SourceExplorer sources={requestSources} />
            </section>
          )}
        </>
      )}
    </div>
  );
}
