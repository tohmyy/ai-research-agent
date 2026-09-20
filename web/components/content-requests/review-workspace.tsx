"use client";

import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { CheckCircle2, XCircle } from "lucide-react";

import { saveDraftRevision } from "@/lib/actions/content-requests";
import { useAsyncAction } from "@/hooks/use-async-action";
import { InlineError } from "@/components/inline-error";
import { ArticleEditor } from "./article-editor";
import { AiAssistantPanel } from "./ai-assistant-panel";
import { EvaluationPanel } from "./evaluation-panel";
import { VersionHistory } from "./version-history";
import { SourceGrounding } from "./source-grounding";
import { ReviewActions } from "./review-actions";
import type { ArticleOption } from "./types";

function extractTitle(markdown: string, fallback: string) {
  const match = markdown.match(/^#\s+(.+)$/m);
  return match?.[1]?.trim() || fallback;
}

export function ReviewWorkspace({
  requestId,
  option,
  readOnly,
  enabledChannels,
}: {
  requestId: string;
  option: ArticleOption;
  readOnly: boolean;
  enabledChannels: string[];
}) {
  const router = useRouter();
  const { pending: saving, error, run } = useAsyncAction();

  function handleSave(markdown: string) {
    const title = extractTitle(markdown, option.title || "Untitled");
    run(async () => {
      await saveDraftRevision(requestId, option.id, title, markdown);
      router.refresh();
    }, "Draft saved.");
  }

  return (
    <div className="space-y-4">
      {error && <InlineError message={error} />}
      {readOnly ? (
        <div
          className={
            option.status === "approved"
              ? "flex items-center gap-2 rounded-md border border-success-border bg-success-subtle px-4 py-3 text-success"
              : "flex items-center gap-2 rounded-md border border-error-border bg-error-subtle px-4 py-3 text-destructive"
          }
        >
          {option.status === "approved" ? (
            <>
              <CheckCircle2 className="size-4" /> Approved
            </>
          ) : (
            <>
              <XCircle className="size-4" /> Rejected
            </>
          )}
        </div>
      ) : (
        <div className="flex justify-end">
          <ReviewActions
            requestId={requestId}
            draftId={option.id}
            enabledChannels={enabledChannels}
          />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="min-w-0">
          {readOnly ? (
            <article className="max-w-article font-serif text-[17px] leading-[1.75] text-foreground">
              <ReactMarkdown>{option.bodyMarkdown || ""}</ReactMarkdown>
            </article>
          ) : (
            <ArticleEditor
              key={option.id}
              initialMarkdown={option.bodyMarkdown || ""}
              onSave={handleSave}
              saving={saving}
            />
          )}
        </section>

        <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          {option.evaluation && <EvaluationPanel evaluation={option.evaluation} />}
          <div className="rounded-lg border border-border bg-card p-4">
            <SourceGrounding sources={option.sources} />
          </div>
          <VersionHistory versions={option.versions} />
          {!readOnly && (
            <AiAssistantPanel
              draftId={option.id}
              currentTitle={option.title || "Untitled"}
              onAccept={(proposal) => handleSave(proposal.bodyMarkdown)}
            />
          )}
        </aside>
      </div>
    </div>
  );
}
