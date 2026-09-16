import {
  CalendarClock,
  CheckCircle2,
  CircleAlert,
  ClipboardEdit,
  Clock3,
  FileEdit,
  LoaderCircle,
  Sparkles,
  XCircle,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

type Tone = "muted" | "info" | "primary" | "warning" | "success" | "destructive";

const STATUS_META: Record<string, { label: string; icon: LucideIcon; tone: Tone }> = {
  draft: { label: "Draft", icon: FileEdit, tone: "muted" },
  submitted: { label: "Submitted", icon: Clock3, tone: "muted" },
  researching: { label: "Researching", icon: LoaderCircle, tone: "info" },
  research_complete: { label: "Research Complete", icon: CheckCircle2, tone: "success" },
  planning: { label: "Planning", icon: LoaderCircle, tone: "info" },
  generating_options: { label: "Generating Options", icon: Sparkles, tone: "primary" },
  evaluating: { label: "Evaluating", icon: LoaderCircle, tone: "info" },
  options_ready: { label: "Awaiting Review", icon: Clock3, tone: "warning" },
  selected: { label: "Selected", icon: CheckCircle2, tone: "success" },
  revising: { label: "Revising", icon: ClipboardEdit, tone: "warning" },
  channel_adapting: { label: "Adapting Channels", icon: Sparkles, tone: "primary" },
  channel_review: { label: "Awaiting Review", icon: Clock3, tone: "warning" },
  approved: { label: "Approved", icon: CheckCircle2, tone: "success" },
  queued: { label: "Queued", icon: CalendarClock, tone: "primary" },
  scheduled: { label: "Scheduled", icon: CalendarClock, tone: "primary" },
  publishing: { label: "Publishing", icon: LoaderCircle, tone: "info" },
  published: { label: "Published", icon: CheckCircle2, tone: "success" },
  failed: { label: "Failed", icon: CircleAlert, tone: "destructive" },
  rejected: { label: "Rejected", icon: XCircle, tone: "destructive" },
};

const TONE_CLASSES: Record<Tone, string> = {
  muted: "border-border bg-muted text-muted-foreground",
  info: "border-info-border bg-info-subtle text-info",
  primary: "border-primary-muted bg-primary-subtle text-primary",
  warning: "border-warning-border bg-warning-subtle text-warning",
  success: "border-success-border bg-success-subtle text-success",
  destructive: "border-error-border bg-error-subtle text-destructive",
};

export function StatusBadge({ status }: { status: string }) {
  const meta = STATUS_META[status] ?? {
    label: status,
    icon: Clock3,
    tone: "muted" as const,
  };
  const Icon = meta.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        TONE_CLASSES[meta.tone],
      )}
    >
      <Icon className="size-3.5" />
      {meta.label}
    </span>
  );
}
