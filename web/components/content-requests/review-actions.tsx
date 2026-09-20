"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import {
  approveArticle,
  rejectArticle,
  requestArticleRevision,
} from "@/lib/actions/content-requests";
import { useAsyncAction } from "@/hooks/use-async-action";
import { InlineError } from "@/components/inline-error";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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

const CHANNEL_LABELS: Record<string, string> = {
  linkedin: "LinkedIn",
  x: "X",
  newsletter: "Newsletter",
};
const ALL_CHANNELS = ["linkedin", "x", "newsletter"];

export function ReviewActions({
  requestId,
  draftId,
  enabledChannels,
}: {
  requestId: string;
  draftId: string;
  enabledChannels: string[];
}) {
  const router = useRouter();
  const { pending, error, run } = useAsyncAction();
  const [revisionNote, setRevisionNote] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [selectedChannels, setSelectedChannels] = useState<string[]>(enabledChannels);

  function toggleChannel(channel: string, checked: boolean) {
    setSelectedChannels((prev) =>
      checked ? [...prev, channel] : prev.filter((c) => c !== channel),
    );
  }

  function handleApprove() {
    run(async () => {
      await approveArticle(requestId, draftId, selectedChannels);
      router.refresh();
    }, selectedChannels.length > 0
      ? "Content approved — adapting for the selected channels."
      : "Content approved.");
  }

  function handleRequestRevision() {
    toast("Requesting revision…", { description: "This can take up to a minute." });
    run(async () => {
      await requestArticleRevision(requestId, draftId, revisionNote);
      setRevisionNote("");
      router.refresh();
    }, "Revision ready.");
  }

  function handleReject() {
    run(async () => {
      await rejectArticle(requestId, draftId, rejectReason);
      setRejectReason("");
      router.refresh();
    }, "Content rejected.");
  }

  return (
    <div className="space-y-3">
      {error && <InlineError message={error} />}
      <div className="flex items-center gap-3">
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button disabled={pending}>Approve</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Content</AlertDialogTitle>
            <AlertDialogDescription>
              {enabledChannels.length > 0
                ? "Choose which channels to adapt this article for. Only configured channels are available."
                : "No channels are configured yet — approving will skip channel adaptation. Set up a channel in Settings to enable it."}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {enabledChannels.length > 0 && (
            <div className="space-y-3">
              {ALL_CHANNELS.map((channel) => {
                const isEnabled = enabledChannels.includes(channel);
                return (
                  <div key={channel} className="flex items-center gap-2">
                    <Checkbox
                      id={`approve-channel-${channel}`}
                      disabled={!isEnabled}
                      checked={isEnabled && selectedChannels.includes(channel)}
                      onCheckedChange={(checked) =>
                        toggleChannel(channel, checked === true)
                      }
                    />
                    <Label
                      htmlFor={`approve-channel-${channel}`}
                      className={!isEnabled ? "text-muted-foreground" : undefined}
                    >
                      {CHANNEL_LABELS[channel]}
                      {!isEnabled && " — Configure in Settings"}
                    </Label>
                  </div>
                );
              })}
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleApprove} disabled={pending}>
              {pending ? "Approving…" : "Approve"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
    </div>
  );
}
