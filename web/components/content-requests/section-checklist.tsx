"use client";

import { useState } from "react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type ChecklistSection = {
  key: string;
  label: string;
  content: ReactNode;
};

/** Section nav for the content-request detail page — only sections with
 * actual content are listed, and selecting one shows just that section
 * instead of stacking Research + Options + Review + Channels + Sources
 * all at once. */
export function SectionChecklist({
  sections,
  defaultActive,
}: {
  sections: ChecklistSection[];
  defaultActive: string;
}) {
  const [active, setActive] = useState(defaultActive);
  const activeSection = sections.find((s) => s.key === active) ?? sections[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {sections.map((section) => (
          <button
            key={section.key}
            type="button"
            onClick={() => setActive(section.key)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-small font-medium transition-colors duration-150",
              activeSection?.key === section.key
                ? "border-primary bg-primary-subtle text-primary"
                : "border-border text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {section.label}
          </button>
        ))}
      </div>

      {activeSection?.content}
    </div>
  );
}
