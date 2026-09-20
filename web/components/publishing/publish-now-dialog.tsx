"use client";

import { Button } from "@/components/ui/button";
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

export function PublishNowDialog({
  channelLabel,
  contentPreview,
  onConfirm,
  pending,
}: {
  channelLabel: string;
  contentPreview: string;
  onConfirm: () => void;
  pending: boolean;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button disabled={pending}>Publish Now</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Publish to {channelLabel}?</AlertDialogTitle>
          <AlertDialogDescription>
            This will publish the approved content immediately. This can&apos;t be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <p className="rounded-md border border-border bg-muted/50 p-2 text-caption text-muted-foreground line-clamp-3">
          {contentPreview}
        </p>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={pending}>
            {pending ? "Publishing…" : "Publish"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
