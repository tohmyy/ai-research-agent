"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";

import { saveChannelContentEdit } from "@/lib/actions/content-requests";
import { useAsyncAction } from "@/hooks/use-async-action";
import { InlineError } from "@/components/inline-error";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EvaluationDialog } from "./evaluation-dialog";
import { VersionHistory } from "./version-history";
import { ChannelReviewActions } from "./channel-review-actions";
import { PublishActions } from "@/components/publishing/publish-actions";
import { LinkedinPreview } from "./linkedin-preview";
import { XPreview } from "./x-preview";
import { NewsletterPreview } from "./newsletter-preview";
import type { ChannelContentItem } from "./types";

const CHANNEL_LABELS: Record<ChannelContentItem["channel"], string> = {
  linkedin: "LinkedIn",
  x: "X",
  newsletter: "Newsletter",
};

function ChannelPane({
  requestId,
  item,
}: {
  requestId: string;
  item: ChannelContentItem;
}) {
  const router = useRouter();
  const { pending: saving, error, run } = useAsyncAction();
  const [subject, setSubject] = useState(item.subject ?? "");
  const [body, setBody] = useState(item.body ?? "");

  const readOnly = item.status === "approved" || item.status === "rejected";
  const dirty = subject !== (item.subject ?? "") || body !== (item.body ?? "");

  function handleSave() {
    run(async () => {
      await saveChannelContentEdit(
        requestId,
        item.id,
        item.channel === "newsletter" ? subject : null,
        body,
      );
      router.refresh();
    }, "Changes saved.");
  }

  return (
    <div className="space-y-4">
      {error && <InlineError message={error} />}

      {item.status === "approved" && (
        <div className="rounded-md border border-success-border bg-success-subtle p-3">
          <PublishActions
            channelContentId={item.id}
            channel={item.channel}
            contentPreview={item.subject || item.body || ""}
            queue={item.queue}
          />
        </div>
      )}

      <div
        className={
          readOnly
            ? "grid gap-6"
            : "grid gap-6 lg:grid-cols-2"
        }
      >
        <section className="min-w-0 space-y-4">
          {item.channel === "linkedin" && <LinkedinPreview body={body} />}
          {item.channel === "x" && <XPreview body={body} />}
          {item.channel === "newsletter" && <NewsletterPreview subject={subject} body={body} />}
        </section>

        {!readOnly && (
          <section className="min-w-0 space-y-3 rounded-lg border border-border bg-card p-4">
            {item.channel === "newsletter" && (
              <div className="space-y-1.5">
                <Label htmlFor={`subject-${item.id}`}>Subject</Label>
                <Input
                  id={`subject-${item.id}`}
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor={`body-${item.id}`}>Body</Label>
              <Textarea
                id={`body-${item.id}`}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={item.channel === "newsletter" ? 16 : 10}
                className="h-full min-h-40"
              />
            </div>
            <div className="flex justify-end">
              <Button size="sm" onClick={handleSave} disabled={!dirty || saving}>
                {saving ? "Saving…" : "Save Changes"}
              </Button>
            </div>
          </section>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <EvaluationDialog versions={item.versions} />
        <VersionHistory versions={item.versions} />
      </div>
    </div>
  );
}

export function ChannelReview({
  requestId,
  items,
}: {
  requestId: string;
  items: ChannelContentItem[];
}) {
  const [active, setActive] = useState(items[0]?.channel);
  const activeItem = items.find((item) => item.channel === active) ?? items[0];

  return (
    <Tabs value={active} onValueChange={(value) => setActive(value as ChannelContentItem["channel"])}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <TabsList>
          {items.map((item) => (
            <TabsTrigger key={item.id} value={item.channel}>
              {CHANNEL_LABELS[item.channel]}
            </TabsTrigger>
          ))}
        </TabsList>

        {activeItem && activeItem.status === "approved" && (
          <div className="flex items-center gap-2 text-success">
            <CheckCircle2 className="size-4" /> Approved
          </div>
        )}
        {activeItem && activeItem.status === "rejected" && (
          <div className="flex items-center gap-2 text-destructive">
            <XCircle className="size-4" /> Rejected
          </div>
        )}
        {activeItem && activeItem.status !== "approved" && activeItem.status !== "rejected" && (
          <ChannelReviewActions requestId={requestId} channelContentId={activeItem.id} />
        )}
      </div>

      {items.map((item) => (
        <TabsContent key={item.id} value={item.channel} className="pt-4">
          <ChannelPane requestId={requestId} item={item} />
        </TabsContent>
      ))}
    </Tabs>
  );
}
