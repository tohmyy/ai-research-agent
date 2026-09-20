"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CircleAlert } from "lucide-react";

import { retryChannelAdaptation, retryResearch } from "@/lib/actions/content-requests";
import { useAsyncAction } from "@/hooks/use-async-action";
import { InlineError } from "@/components/inline-error";
import { Button } from "@/components/ui/button";

const STAGE_LABELS: Record<string, string> = {
  request_received: "Research",
  searching: "Research",
  extracting: "Research",
  analyzing: "Research",
  building_context: "Research",
  planning: "Content Generation",
  generating_options: "Content Generation",
  evaluating: "Evaluation",
  adapting_channels: "Channel Adaptation",
};

export function ResearchFailure({
  requestId,
  error,
  stage,
}: {
  requestId: string;
  error: string | null;
  stage?: string | null;
}) {
  const router = useRouter();
  const [showDetails, setShowDetails] = useState(false);
  const { pending, error: retryError, run } = useAsyncAction();

  const label = (stage && STAGE_LABELS[stage]) || "Content Pipeline";
  const isChannelStage = stage === "adapting_channels";

  function handleRetry() {
    run(async () => {
      if (isChannelStage) {
        await retryChannelAdaptation(requestId);
      } else {
        await retryResearch(requestId);
      }
      router.refresh();
    }, "Retrying…");
  }

  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-error-border bg-error-subtle px-6 py-16 text-center">
      <CircleAlert className="size-8 text-destructive" />
      <div className="space-y-1">
        <p className="text-subsection">{label} failed</p>
        <p className="mx-auto max-w-sm text-body text-muted-foreground">
          We couldn&apos;t complete this step.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Button onClick={handleRetry} disabled={pending}>
          {pending ? "Retrying…" : "Retry"}
        </Button>
        {error && (
          <Button variant="ghost" onClick={() => setShowDetails((v) => !v)}>
            {showDetails ? "Hide Details" : "View Details"}
          </Button>
        )}
      </div>
      {showDetails && error && (
        <pre className="mt-2 max-w-lg overflow-x-auto whitespace-pre-wrap rounded-md bg-card p-3 text-left text-caption text-muted-foreground">
          {error}
        </pre>
      )}
      {retryError && (
        <div className="w-full max-w-lg">
          <InlineError message={retryError} />
        </div>
      )}
    </div>
  );
}
