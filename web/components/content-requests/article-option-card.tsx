import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SourceGrounding } from "./source-grounding";
import type { ArticleOption } from "./types";

function wordCount(markdown: string | null) {
  if (!markdown) return 0;
  return markdown.trim().split(/\s+/).filter(Boolean).length;
}

export function ArticleOptionCard({
  option,
  selected,
  onPreview,
  onSelect,
  selectDisabled,
}: {
  option: ArticleOption;
  selected: boolean;
  onPreview: () => void;
  onSelect: () => void;
  selectDisabled: boolean;
}) {
  return (
    <Card className="border-border bg-card shadow-subtle">
      <CardContent className="space-y-4 py-2">
        <div className="flex items-center justify-between">
          <span className="text-overline uppercase tracking-[0.08em] text-muted-foreground">
            {option.variantLabel || "Option"}
          </span>
          {selected && (
            <Badge
              variant="outline"
              className="border-success-border bg-success-subtle text-success"
            >
              Selected
            </Badge>
          )}
        </div>

        <div className="space-y-1">
          <h3 className="text-subsection">{option.title || "Untitled option"}</h3>
          {option.angle && (
            <p className="text-body text-muted-foreground">{option.angle}</p>
          )}
        </div>

        <p className="text-caption text-muted-foreground">
          Estimated length: {wordCount(option.bodyMarkdown).toLocaleString()} words
        </p>

        <SourceGrounding sources={option.sources} />

        <div className="flex items-center gap-3 pt-2">
          <Button variant="outline" onClick={onPreview}>
            Preview
          </Button>
          <Button onClick={onSelect} disabled={selectDisabled}>
            Select
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
