"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { CheckCircle2, XCircle } from "lucide-react";

import { saveChannelContentEdit } from "@/lib/actions/content-requests";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EvaluationPanel } from "./evaluation-panel";
import { VersionHistory } from "./version-history";
import { ChannelReviewActions } from "./channel-review-actions";
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
  const [saving, startTransition] = useTransition();
  const [subject, setSubject] = useState(item.subject ?? "");
  const [body, setBody] = useState(item.body ?? "");

  const readOnly = item.status === "approved" || item.status === "rejected";
  const dirty = subject !== (item.subject ?? "") || body !== (item.body ?? "");

  function handleSave() {
    startTransition(async () => {
      await saveChannelContentEdit(
        requestId,
        item.id,
        item.channel === "newsletter" ? subject : null,
        body,
      );
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {readOnly ? (
        <div
          className={
            item.status === "approved"
              ? "flex items-center gap-2 rounded-md border border-success-border bg-success-subtle px-4 py-3 text-success"
              : "flex items-center gap-2 rounded-md border border-error-border bg-error-subtle px-4 py-3 text-destructive"
          }
        >
          {item.status === "approved" ? (
            <>
              <CheckCircle2 className="size-4" /> Approved
            </>
          ) : (
            <>
              <XCircle className="size-4" /> Rejected
            </>
          )}
        </div>
      ) : (
        <div className="flex justify-end">
          <ChannelReviewActions requestId={requestId} channelContentId={item.id} />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="min-w-0 space-y-4">
          {item.channel === "linkedin" && <LinkedinPreview body={body} />}
          {item.channel === "x" && <XPreview body={body} />}
          {item.channel === "newsletter" && <NewsletterPreview subject={subject} body={body} />}

          {!readOnly && (
            <div className="space-y-3 rounded-lg border border-border bg-card p-4">
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
                  rows={item.channel === "newsletter" ? 14 : 6}
                />
              </div>
              <div className="flex justify-end">
                <Button size="sm" onClick={handleSave} disabled={!dirty || saving}>
                  {saving ? "Saving…" : "Save Changes"}
                </Button>
              </div>
            </div>
          )}
        </section>

        <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          {item.evaluation && <EvaluationPanel evaluation={item.evaluation} />}
          <VersionHistory versions={item.versions} />
        </aside>
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
  return (
    <Tabs defaultValue={items[0]?.channel}>
      <TabsList>
        {items.map((item) => (
          <TabsTrigger key={item.id} value={item.channel}>
            {CHANNEL_LABELS[item.channel]}
          </TabsTrigger>
        ))}
      </TabsList>
      {items.map((item) => (
        <TabsContent key={item.id} value={item.channel} className="pt-4">
          <ChannelPane requestId={requestId} item={item} />
        </TabsContent>
      ))}
    </Tabs>
  );
}
