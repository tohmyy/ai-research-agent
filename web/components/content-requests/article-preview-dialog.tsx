"use client";

import ReactMarkdown from "react-markdown";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { ArticleOption } from "./types";

export function ArticlePreviewDialog({
  option,
  open,
  onOpenChange,
  onSelect,
  selectDisabled,
}: {
  option: ArticleOption;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: () => void;
  selectDisabled: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-subsection">
            {option.title || "Untitled option"}
          </DialogTitle>
        </DialogHeader>

        <article className="max-w-article font-serif text-[17px] leading-[1.75] text-foreground">
          <ReactMarkdown>{option.bodyMarkdown || ""}</ReactMarkdown>
        </article>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Back
          </Button>
          <Button onClick={onSelect} disabled={selectDisabled}>
            Select Article
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
