import { ExternalLink } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { ResearchSource } from "./types";

function domainOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function formatDate(date: Date | null) {
  if (!date) return null;
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(date);
}

export function SourceDetail({ source }: { source: ResearchSource }) {
  const publishedAt = formatDate(source.publishedAt);
  const excerpt = source.cleanedContent?.slice(0, 800).trim();

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h3 className="text-subsection">{source.title || domainOf(source.url)}</h3>
          {source.included ? (
            <Badge
              variant="outline"
              className="border-success-border bg-success-subtle text-success"
            >
              Used for grounding
            </Badge>
          ) : (
            <Badge variant="outline" className="border-border bg-muted text-muted-foreground">
              Not selected
            </Badge>
          )}
        </div>
        <p className="text-caption text-muted-foreground">
          {domainOf(source.url)}
          {publishedAt && ` · Published ${publishedAt}`}
          {source.author && ` · ${source.author}`}
        </p>
      </div>

      <a
        href={source.url}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1 text-small text-primary underline-offset-4 hover:underline"
      >
        View Source
        <ExternalLink className="size-3.5" />
      </a>

      {excerpt && (
        <p className="text-body text-foreground whitespace-pre-line">
          {excerpt}
          {source.cleanedContent && source.cleanedContent.length > excerpt.length && "…"}
        </p>
      )}
    </div>
  );
}
