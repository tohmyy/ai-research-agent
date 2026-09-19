"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import {
  approveChannelContent,
  rejectChannelContent,
  requestChannelContentRevision,
} from "@/lib/actions/content-requests";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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

export function ChannelReviewActions({
  requestId,
  channelContentId,
}: {
  requestId: string;
  channelContentId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [revisionNote, setRevisionNote] = useState("");
  const [rejectReason, setRejectReason] = useState("");

  function handleApprove() {
    startTransition(async () => {
      await approveChannelContent(requestId, channelContentId);
      toast.success("Content approved.");
      router.refresh();
    });
  }

  function handleRequestRevision() {
    toast("Requesting revision…", { description: "This can take up to a minute." });
    startTransition(async () => {
      await requestChannelContentRevision(requestId, channelContentId, revisionNote);
      setRevisionNote("");
      toast.success("Revision ready.");
      router.refresh();
    });
  }

  function handleReject() {
    startTransition(async () => {
      await rejectChannelContent(requestId, channelContentId, rejectReason);
      setRejectReason("");
      toast("Content rejected.");
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-3">
      <Button onClick={handleApprove} disabled={pending}>
        Approve
      </Button>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline" disabled={pending}>
            Request Revision
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Request Revision</AlertDialogTitle>
            <AlertDialogDescription>What should be changed?</AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            value={revisionNote}
            onChange={(e) => setRevisionNote(e.target.value)}
            rows={3}
            placeholder="Describe what needs to change…"
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRequestRevision}
              disabled={pending || !revisionNote.trim()}
            >
              {pending ? "Requesting…" : "Request Revision"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" disabled={pending}>
            Reject
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Content?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark the content as rejected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={3}
            placeholder="Reason for rejecting…"
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              disabled={pending || !rejectReason.trim()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Reject
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
