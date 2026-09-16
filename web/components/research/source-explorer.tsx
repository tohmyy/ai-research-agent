"use client";

import { useState } from "react";

import { SourceDetail } from "./source-detail";
import { SourceList } from "./source-list";
import type { ResearchSource } from "./types";

export function SourceExplorer({ sources }: { sources: ResearchSource[] }) {
  const [selectedId, setSelectedId] = useState(sources[0]?.id ?? null);
  const selected = sources.find((s) => s.id === selectedId) ?? sources[0];

  if (sources.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
      <aside>
        <SourceList sources={sources} selectedId={selectedId} onSelect={setSelectedId} />
      </aside>
      <section className="min-w-0 rounded-lg border border-border bg-card p-6">
        {selected && <SourceDetail source={selected} />}
      </section>
    </div>
  );
}
