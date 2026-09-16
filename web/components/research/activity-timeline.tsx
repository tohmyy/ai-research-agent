"use client";

import { useState } from "react";
import { Check, ChevronDown, CircleAlert, LoaderCircle } from "lucide-react";

import { cn } from "@/lib/utils";

export type TimelineStep = {
  key: string;
  label: string;
  status: "active" | "complete" | "failed";
  detail: string | null;
  at: string;
};

function StepIcon({ status }: { status: TimelineStep["status"] | "pending" }) {
  if (status === "complete") {
    return (
      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-success-subtle text-success">
        <Check className="size-3" />
      </span>
    );
  }
  if (status === "active") {
    return (
      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-info-subtle text-info">
        <LoaderCircle className="size-3 animate-spin" />
      </span>
    );
  }
  if (status === "failed") {
    return (
      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-error-subtle text-destructive">
        <CircleAlert className="size-3" />
      </span>
    );
  }
  return <span className="size-5 shrink-0 rounded-full border-2 border-border" />;
}

function StepRow({ step }: { step: TimelineStep }) {
  const [expanded, setExpanded] = useState(false);
  const canExpand = step.status === "complete" && Boolean(step.detail);

  return (
    <li className="flex gap-3">
      <div className="flex flex-col items-center">
        <StepIcon status={step.status} />
        <span className="mt-1 w-px flex-1 bg-border" />
      </div>
      <div className="flex-1 pb-4">
        <button
          type="button"
          disabled={!canExpand}
          onClick={() => setExpanded((v) => !v)}
          className={cn(
            "flex items-center gap-1 text-body-medium",
            canExpand ? "cursor-pointer" : "cursor-default",
          )}
        >
          {step.label}
          {canExpand && (
            <ChevronDown
              className={cn("size-3.5 text-muted-foreground transition-transform", expanded && "rotate-180")}
            />
          )}
        </button>
        {expanded && step.detail && (
          <p className="mt-1 text-caption text-muted-foreground">{step.detail}</p>
        )}
        {step.status === "failed" && step.detail && (
          <p className="mt-1 text-caption text-destructive">{step.detail}</p>
        )}
      </div>
    </li>
  );
}

export function ActivityTimeline({ steps }: { steps: TimelineStep[] }) {
  return (
    <ol className="space-y-0">
      {steps.map((step) => (
        <StepRow key={step.key} step={step} />
      ))}
    </ol>
  );
}
