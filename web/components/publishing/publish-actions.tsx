"use client";

import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";

import {
  cancelPublishing,
  editPublishSchedule,
  publishContentNow,
  retryPublishing,
  scheduleContent,
} from "@/lib/actions/publishing";
import { useAsyncAction } from "@/hooks/use-async-action";
import { InlineError } from "@/components/inline-error";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { PublishNowDialog } from "./publish-now-dialog";
import { ScheduleDialog } from "./schedule-dialog";
import { ErrorDetails } from "./error-details";
import type { PublishQueueInfo } from "@/components/content-requests/types";

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

export function PublishActions({
  channelContentId,
  channel,
  contentPreview,
  queue,
}: {
  channelContentId: string;
  channel: string;
  contentPreview: string;
  queue: PublishQueueInfo | null;
}) {
  const router = useRouter();
  const { pending, error, run } = useAsyncAction();
  const channelLabel = CHANNEL_LABELS[channel] ?? channel;

  function handlePublishNow() {
    run(async () => {
      await publishContentNow(channelContentId);
      router.refresh();
    }, "Publishing started.");
  }

  function handleSchedule(scheduledAtIso: string) {
    run(async () => {
      await scheduleContent(channelContentId, scheduledAtIso);
      router.refresh();
    }, "Scheduled.");
  }

  function handleEditSchedule(scheduledAtIso: string) {
    if (!queue) return;
    run(async () => {
      await editPublishSchedule(queue.id, scheduledAtIso);
      router.refresh();
    }, "Schedule updated.");
  }

  function handleCancel() {
    if (!queue) return;
    run(async () => {
      await cancelPublishing(queue.id);
      router.refresh();
    }, "Publishing cancelled.");
  }

  function handleRetry() {
    if (!queue) return;
    run(async () => {
      await retryPublishing(queue.id);
      router.refresh();
    }, "Retrying…");
  }

  let content: React.ReactNode;

  if (!queue || queue.status === "cancelled") {
    content = (
      <div className="flex items-center gap-3">
        {queue?.status === "cancelled" && <StatusBadge status="cancelled" />}
        <PublishNowDialog
          channelLabel={channelLabel}
          contentPreview={contentPreview}
          onConfirm={handlePublishNow}
          pending={pending}
        />
        <ScheduleDialog
          triggerLabel="Schedule"
          title={`Schedule ${channelLabel} Content`}
          channelLabel={channelLabel}
          contentPreview={contentPreview}
          onConfirm={handleSchedule}
          pending={pending}
        />
      </div>
    );
  } else if (queue.status === "scheduled") {
    content = (
      <div className="flex flex-wrap items-center gap-3">
        <StatusBadge status="scheduled" />
        <span className="text-caption text-muted-foreground">
          {queue.scheduledAt ? formatDate(queue.scheduledAt) : null}
        </span>
        <ScheduleDialog
          triggerLabel="Edit Schedule"
          title={`Edit Schedule — ${channelLabel}`}
          channelLabel={channelLabel}
          contentPreview={contentPreview}
          initialScheduledAt={queue.scheduledAt}
          onConfirm={handleEditSchedule}
          pending={pending}
        />
        <Button variant="destructive" onClick={handleCancel} disabled={pending}>
          Cancel
        </Button>
      </div>
    );
  } else if (queue.status === "queued" || queue.status === "publishing") {
    content = (
      <div className="flex items-center gap-2 text-caption text-muted-foreground">
        <LoaderCircle className="size-4 animate-spin" />
        Publishing…
      </div>
    );
  } else if (queue.status === "published") {
    content = (
      <div className="flex items-center gap-3">
        <StatusBadge status="published" />
        {queue.externalPostId && (
          <span className="text-caption text-muted-foreground">Ref: {queue.externalPostId}</span>
        )}
      </div>
    );
  } else if (queue.status === "failed") {
    content = (
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <StatusBadge status="failed" />
          <Button onClick={handleRetry} disabled={pending}>
            {pending ? "Retrying…" : "Retry"}
          </Button>
        </div>
        {queue.error && <ErrorDetails error={queue.error} />}
      </div>
    );
  } else {
    content = <StatusBadge status={queue.status} />;
  }

  return (
    <div className="space-y-2">
      {error && <InlineError message={error} />}
      {content}
    </div>
  );
}
