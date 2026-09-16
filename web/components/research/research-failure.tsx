"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { CircleAlert } from "lucide-react";

import { retryResearch } from "@/lib/actions/content-requests";
import { Button } from "@/components/ui/button";

function RetryButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Retrying…" : "Retry"}
    </Button>
  );
}

export function ResearchFailure({
  requestId,
  error,
}: {
  requestId: string;
  error: string | null;
}) {
  const [showDetails, setShowDetails] = useState(false);
  const retryWithId = retryResearch.bind(null, requestId);

  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-error-border bg-error-subtle px-6 py-16 text-center">
      <CircleAlert className="size-8 text-destructive" />
      <div className="space-y-1">
        <p className="text-subsection">Research step failed</p>
        <p className="mx-auto max-w-sm text-body text-muted-foreground">
          We couldn&apos;t complete this step.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <form action={retryWithId}>
          <RetryButton />
        </form>
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
    </div>
  );
}
