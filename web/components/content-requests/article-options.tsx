"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { selectArticle } from "@/lib/actions/content-requests";
import { ArticleOptionCard } from "./article-option-card";
import { ArticlePreviewDialog } from "./article-preview-dialog";
import type { ArticleOption } from "./types";

export function ArticleOptions({
  requestId,
  options,
  alreadySelected,
}: {
  requestId: string;
  options: ArticleOption[];
  alreadySelected: boolean;
}) {
  const router = useRouter();
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const previewOption = options.find((o) => o.id === previewId) ?? null;

  function handleSelect(draftId: string) {
    startTransition(async () => {
      await selectArticle(requestId, draftId);
      setPreviewId(null);
      router.refresh();
    });
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {options.map((option) => (
        <ArticleOptionCard
          key={option.id}
          option={option}
          selected={option.status === "selected"}
          onPreview={() => setPreviewId(option.id)}
          onSelect={() => handleSelect(option.id)}
          selectDisabled={pending || alreadySelected}
        />
      ))}

      {previewOption && (
        <ArticlePreviewDialog
          option={previewOption}
          open={Boolean(previewOption)}
          onOpenChange={(open) => !open && setPreviewId(null)}
          onSelect={() => handleSelect(previewOption.id)}
          selectDisabled={pending || alreadySelected}
        />
      )}
    </div>
  );
}
