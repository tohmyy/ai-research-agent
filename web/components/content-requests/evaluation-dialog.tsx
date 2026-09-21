"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { EvaluationDetails } from "./evaluation-details";
import type { DraftVersion } from "./types";

/** Compact "AI Evaluation" trigger that opens the full detail in a modal —
 * used for channel review, where an always-on expanded side panel competed
 * with the side-by-side preview/editor for space. When the channel has
 * multiple evaluated versions, the modal's footer cycles between them
 * (newest first) instead of only ever showing the current one. */
export function EvaluationDialog({ versions }: { versions: DraftVersion[] }) {
  const evaluated = [...versions]
    .filter((v) => v.evaluation !== null)
    .sort((a, b) => b.version - a.version);
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  if (evaluated.length === 0) return null;
  const current = evaluated[index]!;

  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
      <div>
        <p className="text-body-medium">AI Evaluation</p>
        <p className="text-caption text-muted-foreground">Evaluation complete</p>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          setIndex(0);
          setOpen(true);
        }}
      >
        View Evaluation
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-subsection">
              AI Evaluation — v{current.version}
              {index === 0 && " · Current"}
            </DialogTitle>
          </DialogHeader>

          <EvaluationDetails evaluation={current.evaluation!} />

          {evaluated.length > 1 && (
            <DialogFooter className="flex-row items-center justify-between sm:justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIndex((i) => Math.min(i + 1, evaluated.length - 1))}
                disabled={index === evaluated.length - 1}
              >
                <ChevronLeft className="size-4" /> Previous
              </Button>
              <span className="text-caption text-muted-foreground">
                {evaluated.length - index} of {evaluated.length}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIndex((i) => Math.max(i - 1, 0))}
                disabled={index === 0}
              >
                Next <ChevronRight className="size-4" />
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
