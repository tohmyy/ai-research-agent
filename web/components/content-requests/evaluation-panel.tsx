"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Evaluation } from "./types";

function overallScore(evaluation: Evaluation) {
  if (evaluation.criterionScores.length === 0) return null;
  const total = evaluation.criterionScores.reduce((sum, c) => sum + c.score, 0);
  return total / evaluation.criterionScores.length;
}

export function EvaluationPanel({ evaluation }: { evaluation: Evaluation }) {
  const [expanded, setExpanded] = useState(false);
  const score = overallScore(evaluation);
  const strengths = evaluation.criterionScores.filter((c) => c.score >= 8);
  const needsImprovement = evaluation.criterionScores.filter((c) => c.score <= 6);

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
        <div className="mt-4 space-y-4 border-t border-border pt-4">
          {score !== null && (
            <div>
              <p className="text-2xl font-semibold leading-8 tracking-[-0.02em]">
                {score.toFixed(1)} / 10
              </p>
              <p className="text-caption text-muted-foreground">
                An AI-assisted read on quality — not an absolute measure. Use your own judgment.
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-4">
            {evaluation.criterionScores.map((c) => (
              <div key={c.criterion}>
                <p className="text-caption text-muted-foreground">{c.criterion}</p>
                <p className="text-body-medium">{c.score} / 10</p>
              </div>
            ))}
          </div>

          {strengths.length > 0 && (
            <div className="space-y-1">
              <p className="text-body-medium">Strengths</p>
              <ul className="space-y-0.5">
                {strengths.map((c) => (
                  <li key={c.criterion} className="text-body text-success">
                    ✓ {c.note}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {(needsImprovement.length > 0 || evaluation.unsupportedClaims.length > 0) && (
            <div className="space-y-1">
              <p className="text-body-medium">Needs Improvement</p>
              <ul className="space-y-0.5">
                {needsImprovement.map((c) => (
                  <li key={c.criterion} className="text-body text-warning">
                    ! {c.note}
                  </li>
                ))}
                {evaluation.unsupportedClaims.map((claim, i) => (
                  <li key={i} className="text-body text-warning">
                    ! Unsupported claim: {claim}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {evaluation.recommendedChanges && (
            <div className="space-y-1">
              <p className="text-body-medium">Recommended Changes</p>
              <p className="whitespace-pre-line text-body text-muted-foreground">
                {evaluation.recommendedChanges}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
