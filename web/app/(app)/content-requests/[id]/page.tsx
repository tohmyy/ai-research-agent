import { notFound } from "next/navigation";
import { asc, desc, eq, inArray } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  articleDrafts,
  contentPlans,
  contentRequests,
  draftSources,
  researchJobs,
  sources,
} from "@/lib/db/schema";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { ActivityTimeline, type TimelineStep } from "@/components/research/activity-timeline";
import { SourceExplorer } from "@/components/research/source-explorer";
import { ResearchFailure } from "@/components/research/research-failure";
import { LiveRefresh } from "@/components/research/live-refresh";
import { ArticleOptions } from "@/components/content-requests/article-options";
import type { ArticleOption } from "@/components/content-requests/types";

const IN_PROGRESS_STATUSES = new Set([
  "submitted",
  "researching",
  "research_complete",
  "planning",
  "generating_options",
]);

type PlanAngle = {
  variant_label: string;
  angle: string;
};

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

  const drafts = await db
    .select()
    .from(articleDrafts)
    .where(eq(articleDrafts.requestId, id))
    .orderBy(asc(articleDrafts.createdAt));

  let options: ArticleOption[] = [];
  if (drafts.length > 0) {
    const [plan] = await db
      .select()
      .from(contentPlans)
      .where(eq(contentPlans.requestId, id))
      .orderBy(desc(contentPlans.createdAt))
      .limit(1);
    const angles = ((plan?.planJson as { angles?: PlanAngle[] } | null)?.angles ?? []) as PlanAngle[];

    const draftSourceRows = await db
      .select({
        draftId: draftSources.draftId,
        title: sources.title,
        url: sources.url,
      })
      .from(draftSources)
      .innerJoin(sources, eq(draftSources.sourceId, sources.id))
      .where(
        inArray(
          draftSources.draftId,
          drafts.map((d) => d.id),
        ),
      );

    options = drafts.map((draft) => ({
      id: draft.id,
      variantLabel: draft.variantLabel,
      title: draft.title,
      bodyMarkdown: draft.bodyMarkdown,
      status: draft.status,
      angle:
        angles.find((a) => a.variant_label === draft.variantLabel)?.angle ?? null,
      sources: draftSourceRows
        .filter((row) => row.draftId === draft.id)
        .map((row) => ({ title: row.title, url: row.url })),
    }));
  }

  const steps = (job?.steps as TimelineStep[] | null) ?? [];
  const inProgress = IN_PROGRESS_STATUSES.has(request.status);
  const hasOptions = options.length > 0;

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
              <ActivityTimeline steps={steps} />
            </section>
          )}

          {hasOptions && (
            <section className="space-y-4">
              <h2 className="text-section-title font-semibold tracking-[-0.01em]">
                Article Options
              </h2>
              <ArticleOptions
                requestId={request.id}
                options={options}
                alreadySelected={request.status !== "options_ready"}
              />
            </section>
          )}

          {requestSources.length > 0 && (
            <section id="sources" className="space-y-4 scroll-mt-6">
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
