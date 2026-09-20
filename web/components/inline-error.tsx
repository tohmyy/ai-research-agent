import { CircleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";

/** Persistent inline error state — explains what happened and offers Retry
 * where appropriate, per ui-design-spec.md §68's Error States requirement.
 * A toast alone is not sufficient for an important failure (§65). */
export function InlineError({
  message,
  onRetry,
  retrying,
}: {
  message: string;
  onRetry?: () => void;
  retrying?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-md border border-error-border bg-error-subtle px-4 py-3 text-destructive">
      <div className="flex items-start gap-2">
        <CircleAlert className="mt-0.5 size-4 shrink-0" />
        <p className="text-body">{message}</p>
      </div>
      {onRetry && (
        <Button
          size="sm"
          variant="outline"
          onClick={onRetry}
          disabled={retrying}
          className="shrink-0"
        >
          {retrying ? "Retrying…" : "Retry"}
        </Button>
      )}
    </div>
  );
}
