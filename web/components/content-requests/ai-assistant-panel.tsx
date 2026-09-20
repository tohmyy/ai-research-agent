"use client";

import { useState, useTransition } from "react";
import ReactMarkdown from "react-markdown";
import { Sparkles } from "lucide-react";

import { proposeAiAssistEdit } from "@/lib/actions/content-requests";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const QUICK_ACTIONS = [
  { label: "Improve", instruction: "Improve the overall clarity, flow, and quality of this article." },
  { label: "Rewrite", instruction: "Rewrite this article in a more conversational tone." },
  { label: "Shorten", instruction: "Shorten this article while keeping every key point." },
  { label: "Expand", instruction: "Expand this article with more detail and examples from the source material." },
  { label: "Change Tone", instruction: "Rewrite this article in a more confident, authoritative tone." },
];

type Proposal = { title: string; bodyMarkdown: string };

export function AiAssistantPanel({
  draftId,
  currentTitle,
  onAccept,
}: {
  draftId: string;
  currentTitle: string;
  onAccept: (proposal: Proposal) => void;
}) {
  const [instruction, setInstruction] = useState("");
  const [lastInstruction, setLastInstruction] = useState<string | null>(null);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function propose(text: string) {
    if (!text.trim()) return;
    setError(null);
    setLastInstruction(text);
    startTransition(async () => {
      try {
        const result = await proposeAiAssistEdit(draftId, text);
        setProposal(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong generating a suggestion.");
      }
    });
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="size-4 text-primary" />
        <p className="text-body-medium">AI Assistant</p>
      </div>

      {!proposal && (
        <div className="space-y-3">
          <p className="text-caption text-muted-foreground">What would you like to change?</p>
          <div className="flex flex-wrap gap-2">
            {QUICK_ACTIONS.map((action) => (
              <Button
                key={action.label}
                variant="outline"
                size="sm"
                disabled={pending}
                onClick={() => propose(action.instruction)}
              >
                {action.label}
              </Button>
            ))}
          </div>
          <div className="space-y-2">
            <Textarea
              placeholder="Or describe what you'd like changed…"
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              rows={2}
            />
            <Button
              size="sm"
              disabled={pending || !instruction.trim()}
              onClick={() => propose(instruction)}
            >
              {pending ? "Thinking…" : "Ask AI Assistant"}
            </Button>
          </div>
          {error && <p className="text-caption text-destructive">{error}</p>}
        </div>
      )}

      {proposal && (
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-overline uppercase tracking-[0.08em] text-muted-foreground">
              Current
            </p>
            <p className="text-body-medium">{currentTitle}</p>
          </div>
          <div className="space-y-2 rounded-md border border-primary-muted bg-primary-subtle p-3">
            <p className="text-overline uppercase tracking-[0.08em] text-primary">Proposed</p>
            <p className="text-body-medium">{proposal.title}</p>
            <div className="max-h-64 overflow-y-auto text-body text-foreground">
              <ReactMarkdown>{proposal.bodyMarkdown}</ReactMarkdown>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={() => { onAccept(proposal); setProposal(null); }}>
              Accept
            </Button>
            <Button variant="outline" onClick={() => setProposal(null)}>
              Reject
            </Button>
            <Button
              variant="ghost"
              disabled={pending || !lastInstruction}
              onClick={() => propose(lastInstruction!)}
            >
              Try Again
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
