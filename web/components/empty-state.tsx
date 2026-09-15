import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border bg-card px-6 py-16 text-center">
      {Icon && <Icon className="size-8 text-muted-foreground" />}
      <div className="space-y-1">
        <p className="text-subsection">{title}</p>
        <p className="mx-auto max-w-sm text-body text-muted-foreground">
          {description}
        </p>
      </div>
      {action}
    </div>
  );
}
