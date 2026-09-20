import { cn } from "@/lib/utils";

/** Resetchy's mark: a simple rounded-square monogram, replacing the
 * generic "AI magic" sparkle icon previously used in the sidebar header. */
export function Logo({ collapsed }: { collapsed?: boolean }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <div
        aria-hidden
        className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-[17px] font-bold leading-none text-primary-foreground"
      >
        R
      </div>
      {!collapsed && (
        <span className={cn("truncate text-subsection font-semibold tracking-[-0.01em]")}>
          Resetchy
        </span>
      )}
    </div>
  );
}
