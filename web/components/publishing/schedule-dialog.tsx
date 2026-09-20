"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

function toLocalInputValue(date: Date | null): string {
  const base = date ?? new Date(Date.now() + 60 * 60 * 1000);
  const offset = base.getTimezoneOffset();
  const local = new Date(base.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

export function ScheduleDialog({
  triggerLabel,
  title,
  channelLabel,
  contentPreview,
  initialScheduledAt,
  onConfirm,
  pending,
}: {
  triggerLabel: string;
  title: string;
  channelLabel: string;
  contentPreview: string;
  initialScheduledAt?: Date | null;
  onConfirm: (scheduledAtIso: string) => void;
  pending: boolean;
}) {
  const [value, setValue] = useState(() => toLocalInputValue(initialScheduledAt ?? null));

  function handleConfirm() {
    onConfirm(new Date(value).toISOString());
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" disabled={pending}>
          {triggerLabel}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>
            Schedule this {channelLabel} content to publish automatically at the chosen time.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-3">
          <p className="rounded-md border border-border bg-muted/50 p-2 text-caption text-muted-foreground line-clamp-3">
            {contentPreview}
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="schedule-datetime">Date &amp; time</Label>
            <Input
              id="schedule-datetime"
              type="datetime-local"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={pending || !value}>
            {pending ? "Saving…" : "Confirm"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
