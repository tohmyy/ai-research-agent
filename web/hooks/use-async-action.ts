"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

/** Wraps a server-action call with the failure-handling pattern
 * ui-design-spec.md §65/§68 require: never rely on a toast alone for an
 * important failure — always also surface a persistent inline error the
 * user can read and retry from, in addition to the toast. */
export function useAsyncAction() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(action: () => Promise<void>, successMessage?: string) {
    setError(null);
    startTransition(async () => {
      try {
        await action();
        if (successMessage) {
          toast.success(successMessage);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Something went wrong.";
        setError(message);
        toast.error(message);
      }
    });
  }

  return { pending, error, run, clearError: () => setError(null) };
}
