"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

import { EvaluationDetails } from "./evaluation-details";
import type { Evaluation } from "./types";

export function EvaluationPanel({ evaluation }: { evaluation: Evaluation }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between text-left"
      >
        <div>
          <p className="text-body-medium">AI Evaluation</p>
          <p className="text-caption text-muted-foreground">Evaluation complete</p>
        </div>
        <span className="flex items-center gap-1 text-small text-primary">
          {expanded ? "Hide Evaluation" : "Show Evaluation"}
          <ChevronDown className={`size-3.5 transition-transform ${expanded ? "rotate-180" : ""}`} />
        </span>
      </button>

      {expanded && (
        <div className="mt-4 border-t border-border pt-4">
          <EvaluationDetails evaluation={evaluation} />
        </div>
      )}
    </div>
  );
}
