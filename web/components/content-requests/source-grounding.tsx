function domainOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function SourceGrounding({
  sources,
}: {
  sources: { title: string | null; url: string }[];
}) {
  if (sources.length === 0) return null;

  const names = sources.map((s) => s.title || domainOf(s.url));
  const shown = names.slice(0, 3);
  const remaining = names.length - shown.length;

  return (
    <div className="space-y-0.5 text-caption text-muted-foreground">
      <p>
        Grounded in {sources.length} source{sources.length === 1 ? "" : "s"}
      </p>
      <p>
        {shown.join(" · ")}
        {remaining > 0 && ` · +${remaining}`}
        {remaining > 0 && " · see the Sources tab above for the full list"}
      </p>
    </div>
  );
}
