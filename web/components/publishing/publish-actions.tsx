"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { LoaderCircle } from "lucide-react";

import {
  cancelPublishing,
  editPublishSchedule,
  publishContentNow,
  retryPublishing,
  scheduleContent,
} from "@/lib/actions/publishing";
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
  const [pending, startTransition] = useTransition();
  const channelLabel = CHANNEL_LABELS[channel] ?? channel;

  function handlePublishNow() {
    startTransition(async () => {
      await publishContentNow(channelContentId);
      toast.success("Publishing started.");
      router.refresh();
    });
  }

  function handleSchedule(scheduledAtIso: string) {
    startTransition(async () => {
      await scheduleContent(channelContentId, scheduledAtIso);
      toast.success("Scheduled.");
      router.refresh();
    });
  }

  function handleEditSchedule(scheduledAtIso: string) {
    if (!queue) return;
    startTransition(async () => {
      await editPublishSchedule(queue.id, scheduledAtIso);
      toast.success("Schedule updated.");
      router.refresh();
    });
  }

  function handleCancel() {
    if (!queue) return;
    startTransition(async () => {
      await cancelPublishing(queue.id);
      toast("Publishing cancelled.");
      router.refresh();
    });
  }

  function handleRetry() {
    if (!queue) return;
    startTransition(async () => {
      await retryPublishing(queue.id);
      toast.success("Retrying…");
      router.refresh();
    });
  }

  if (!queue || queue.status === "cancelled") {
    return (
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
  }

  if (queue.status === "scheduled") {
    return (
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
  }

  if (queue.status === "queued" || queue.status === "publishing") {
    return (
      <div className="flex items-center gap-2 text-caption text-muted-foreground">
        <LoaderCircle className="size-4 animate-spin" />
        Publishing…
      </div>
    );
  }

  if (queue.status === "published") {
    return (
      <div className="flex items-center gap-3">
        <StatusBadge status="published" />
        {queue.externalPostId && (
          <span className="text-caption text-muted-foreground">Ref: {queue.externalPostId}</span>
        )}
      </div>
    );
  }

  if (queue.status === "failed") {
    return (
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
  }

  return <StatusBadge status={queue.status} />;
}
