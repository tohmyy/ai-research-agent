import { notFound } from "next/navigation";
import { asc, desc, eq, inArray } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  approvals,
  articleDrafts,
  channelConfigs,
  channelContent,
  contentPlans,
  contentRequests,
  draftSources,
  evaluations,
  publishingQueue,
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
import { ReviewWorkspace } from "@/components/content-requests/review-workspace";
import { ChannelReview } from "@/components/content-requests/channel-review";
import {
  SectionChecklist,
  type ChecklistSection,
} from "@/components/content-requests/section-checklist";
import type {
  ArticleOption,
  ChannelContentItem,
  DraftVersion,
  Evaluation,
  EvaluationCriterionScore,
  PublishQueueInfo,
} from "@/components/content-requests/types";

const IN_PROGRESS_STATUSES = new Set([
  "submitted",
  "researching",
  "research_complete",
  "planning",
  "generating_options",
  "evaluating",
  "channel_adapting",
]);

const REVIEW_STATUSES = new Set([
  "selected",
  "approved",
  "rejected",
  "channel_adapting",
  "channel_review",
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

  const allDrafts = await db
    .select()
    .from(articleDrafts)
    .where(eq(articleDrafts.requestId, id))
    .orderBy(asc(articleDrafts.version));

  let options: ArticleOption[] = [];
  if (allDrafts.length > 0) {
    const [plan] = await db
      .select()
      .from(contentPlans)
      .where(eq(contentPlans.requestId, id))
      .orderBy(desc(contentPlans.createdAt))
      .limit(1);
    const angles = ((plan?.planJson as { angles?: PlanAngle[] } | null)?.angles ?? []) as PlanAngle[];

    const draftIds = allDrafts.map((d) => d.id);

    const evalRows = await db
      .select()
      .from(evaluations)
      .where(inArray(evaluations.draftId, draftIds))
      .orderBy(asc(evaluations.createdAt));

    const evalByDraftId = new Map<string, Evaluation>();
    for (const row of evalRows) {
      if (!row.draftId) continue;
      evalByDraftId.set(row.draftId, {
        overallStatus: row.overallStatus,
        criterionScores: (row.criterionScores as EvaluationCriterionScore[] | null) ?? [],
        unsupportedClaims: (row.unsupportedClaims as string[] | null) ?? [],
        recommendedChanges: row.recommendedChanges,
        createdAt: row.createdAt,
      });
    }

    // Group by variant label; the highest version per group is the current
    // option shown on the cards, the whole group is its version history.
    const byVariant = new Map<string, typeof allDrafts>();
    for (const draft of allDrafts) {
      const key = draft.variantLabel ?? draft.id;
      byVariant.set(key, [...(byVariant.get(key) ?? []), draft]);
    }

    const leafIds = [...byVariant.values()].map(
      (group) => group[group.length - 1]!.id,
    );

    const draftSourceRows = await db
      .select({
        draftId: draftSources.draftId,
        title: sources.title,
        url: sources.url,
      })
      .from(draftSources)
      .innerJoin(sources, eq(draftSources.sourceId, sources.id))
      .where(inArray(draftSources.draftId, leafIds));

    options = [...byVariant.values()].map((group) => {
      const leaf = group[group.length - 1]!;
      const versions: DraftVersion[] = group.map((d) => ({
        id: d.id,
        version: d.version,
        isRevision: d.parentDraftId !== null,
        createdAt: d.createdAt,
        evaluation: evalByDraftId.get(d.id) ?? null,
      }));

      return {
        id: leaf.id,
        variantLabel: leaf.variantLabel,
        title: leaf.title,
        bodyMarkdown: leaf.bodyMarkdown,
        status: leaf.status,
        angle: angles.find((a) => a.variant_label === leaf.variantLabel)?.angle ?? null,
        sources: draftSourceRows
          .filter((row) => row.draftId === leaf.id)
          .map((row) => ({ title: row.title, url: row.url })),
        evaluation: evalByDraftId.get(leaf.id) ?? null,
        versions,
      };
    });
  }

  let reviewedOption: ArticleOption | null = null;
  if (REVIEW_STATUSES.has(request.status) && options.length > 0) {
    // The reviewed slot is whichever variant has an `approvals` row (Phase 5
    // actions always target it), or — before any review action has
    // happened yet — the one Phase 3's selectArticle marked "selected".
    const [approvedTarget] = await db
      .select({ variantLabel: articleDrafts.variantLabel })
      .from(approvals)
      .innerJoin(articleDrafts, eq(articleDrafts.id, approvals.targetId))
      .where(eq(articleDrafts.requestId, id))
      .orderBy(desc(approvals.createdAt))
      .limit(1);

    reviewedOption =
      options.find((o) => o.variantLabel === approvedTarget?.variantLabel) ??
      options.find((o) => o.status === "selected") ??
      null;
  }

  const allChannelContent = reviewedOption
    ? await db
        .select()
        .from(channelContent)
        .where(eq(channelContent.draftId, reviewedOption.id))
        .orderBy(asc(channelContent.version))
    : [];

  let channelItems: ChannelContentItem[] = [];
  if (allChannelContent.length > 0) {
    const contentIds = allChannelContent.map((c) => c.id);

    const channelEvalRows = await db
      .select()
      .from(evaluations)
      .where(inArray(evaluations.channelContentId, contentIds))
      .orderBy(asc(evaluations.createdAt));

    const evalByContentId = new Map<string, Evaluation>();
    for (const row of channelEvalRows) {
      if (!row.channelContentId) continue;
      evalByContentId.set(row.channelContentId, {
        overallStatus: row.overallStatus,
        criterionScores: (row.criterionScores as EvaluationCriterionScore[] | null) ?? [],
        unsupportedClaims: (row.unsupportedClaims as string[] | null) ?? [],
        recommendedChanges: row.recommendedChanges,
        createdAt: row.createdAt,
      });
    }

    // Group by channel; the highest version per group is the current
    // content shown, the whole group is its version history — same
    // leaf/group pattern as article options above.
    const byChannel = new Map<string, typeof allChannelContent>();
    for (const item of allChannelContent) {
      byChannel.set(item.channel, [...(byChannel.get(item.channel) ?? []), item]);
    }

    const leafIds = [...byChannel.values()].map((group) => group[group.length - 1]!.id);
    const queueRows = leafIds.length
      ? await db
          .select()
          .from(publishingQueue)
          .where(inArray(publishingQueue.channelContentId, leafIds))
          .orderBy(asc(publishingQueue.createdAt))
      : [];
    // Most recent queue row per leaf is "current" — a channel_content can
    // accumulate more than one queue row over time (e.g. a cancelled
    // attempt followed by a fresh Publish Now).
    const queueByContentId = new Map<string, PublishQueueInfo>();
    for (const row of queueRows) {
      queueByContentId.set(row.channelContentId, {
        id: row.id,
        status: row.status,
        scheduledAt: row.scheduledAt,
        publishedAt: row.publishedAt,
        externalPostId: row.externalPostId,
        error: row.error,
      });
    }

    channelItems = [...byChannel.values()].map((group) => {
      const leaf = group[group.length - 1]!;
      const versions: DraftVersion[] = group.map((c) => ({
        id: c.id,
        version: c.version,
        isRevision: c.parentContentId !== null,
        createdAt: c.createdAt,
        evaluation: evalByContentId.get(c.id) ?? null,
      }));

      return {
        id: leaf.id,
        channel: leaf.channel as ChannelContentItem["channel"],
        subject: leaf.subject,
        body: leaf.body,
        status: leaf.status,
        evaluation: evalByContentId.get(leaf.id) ?? null,
        versions,
        queue: queueByContentId.get(leaf.id) ?? null,
      };
    });
  }

  const enabledChannelRows = await db
    .select({ channel: channelConfigs.channel })
    .from(channelConfigs)
    .where(eq(channelConfigs.enabled, true));
  const enabledChannels = enabledChannelRows.map((r) => r.channel);

  const steps = (job?.steps as TimelineStep[] | null) ?? [];
  const inProgress = IN_PROGRESS_STATUSES.has(request.status);
  const hasOptions = options.length > 0 && !REVIEW_STATUSES.has(request.status);

  return (
    <div className="space-y-8">
      <LiveRefresh active={inProgress} />

      <PageHeader
        title={request.rawIdea}
        description={`For: ${request.targetAudience}`}
        action={<StatusBadge status={request.status} />}
      />

      {request.status === "failed" ? (
        <ResearchFailure requestId={request.id} error={job?.error ?? null} stage={job?.stage ?? null} />
      ) : (
        (() => {
          const sections: ChecklistSection[] = [];

          if (steps.length > 0) {
            sections.push({
              key: "research",
              label: inProgress ? "Researching" : "Research",
              content: <ActivityTimeline steps={steps} />,
            });
          }

          if (hasOptions) {
            sections.push({
              key: "options",
              label: "Article Options",
              content: (
                <ArticleOptions
                  requestId={request.id}
                  options={options}
                  alreadySelected={request.status !== "options_ready"}
                />
              ),
            });
          }

          if (reviewedOption) {
            sections.push({
              key: "review",
              label: "Review",
              content: (
                <ReviewWorkspace
                  requestId={request.id}
                  option={reviewedOption}
                  readOnly={request.status !== "selected"}
                  enabledChannels={enabledChannels}
                />
              ),
            });
          }

          if (channelItems.length > 0) {
            sections.push({
              key: "channels",
              label: "Channel Content",
              content: <ChannelReview requestId={request.id} items={channelItems} />,
            });
          }

          if (requestSources.length > 0) {
            sections.push({
              key: "sources",
              label: "Sources",
              content: <SourceExplorer sources={requestSources} />,
            });
          }

          if (sections.length === 0) return null;

          // Default to whichever section reflects the furthest-along stage
          // that actually has content, so a returning reviewer lands on
          // the most relevant section rather than always on Research.
          const defaultActive =
            (channelItems.length > 0 && "channels") ||
            (reviewedOption && "review") ||
            (hasOptions && "options") ||
            (steps.length > 0 && "research") ||
            (requestSources.length > 0 && "sources") ||
            sections[0]!.key;

          return <SectionChecklist sections={sections} defaultActive={defaultActive} />;
        })()
      )}
    </div>
  );
}
