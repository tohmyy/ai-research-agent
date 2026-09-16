import { cn } from "@/lib/utils";
import type { ResearchSource } from "./types";

function domainOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function SourceList({
  sources,
  selectedId,
  onSelect,
}: {
  sources: ResearchSource[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <ul className="space-y-1">
      {sources.map((source) => (
        <li key={source.id}>
          <button
            type="button"
            onClick={() => onSelect(source.id)}
            className={cn(
              "w-full rounded-md px-3 py-2 text-left transition-colors duration-150",
              selectedId === source.id
                ? "bg-primary-subtle text-primary"
                : "hover:bg-muted",
            )}
          >
            <p className="truncate text-body-medium">
              {source.title || domainOf(source.url)}
            </p>
            <p className="truncate text-caption text-muted-foreground">
              {domainOf(source.url)}
              {!source.included && " · not used for grounding"}
            </p>
          </button>
        </li>
      ))}
    </ul>
  );
}
