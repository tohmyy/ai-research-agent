"use client";

import { useState } from "react";
import { ChevronDown, Copy } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

export function ErrorDetails({ error }: { error: string }) {
  const [expanded, setExpanded] = useState(false);

  function handleCopy() {
    navigator.clipboard
      .writeText(error)
      .then(() => toast.success("Error details copied."))
      .catch(() => toast.error("Could not copy to clipboard."));
  }

  return (
    <div className="rounded-md border border-error-border bg-error-subtle text-destructive">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between px-3 py-2 text-left text-small font-medium"
      >
        Technical Details
        <ChevronDown className={`size-3.5 transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>
      {expanded && (
        <div className="space-y-2 border-t border-error-border px-3 py-2">
          <p className="whitespace-pre-wrap break-words text-caption">{error}</p>
          <Button size="sm" variant="outline" onClick={handleCopy}>
            <Copy className="size-3.5" /> Copy Details
          </Button>
        </div>
      )}
    </div>
  );
}
