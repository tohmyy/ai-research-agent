export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-6">
      <div className="space-y-1">
        <h1 className="text-page-title font-semibold tracking-[-0.02em]">
          {title}
        </h1>
        {description && (
          <p className="text-body text-muted-foreground">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
