"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

import type { DraftVersion } from "./types";

function formatTimestamp(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function overallScore(version: DraftVersion) {
  const scores = version.evaluation?.criterionScores;
  if (!scores || scores.length === 0) return null;
  return scores.reduce((sum, c) => sum + c.score, 0) / scores.length;
}

export function VersionHistory({ versions }: { versions: DraftVersion[] }) {
  const [expanded, setExpanded] = useState(false);

  if (versions.length <= 1) return null;

  const sorted = [...versions].sort((a, b) => b.version - a.version);

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between text-left"
      >
        <p className="text-body-medium">Version History</p>
        <ChevronDown className={`size-3.5 transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>

      {expanded && (
        <ul className="mt-4 space-y-3 border-t border-border pt-4">
          {sorted.map((version, i) => {
            const score = overallScore(version);
            return (
              <li key={version.id} className="text-body">
                <p className="text-body-medium">
                  v{version.version} {i === 0 && "· Current"}
                </p>
                <p className="text-caption text-muted-foreground">
                  {version.isRevision ? "AI Revision" : "Initial Generation"} ·{" "}
                  {formatTimestamp(version.createdAt)}
                  {score !== null && ` · Score: ${score.toFixed(1)}`}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
