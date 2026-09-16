"use client";

import { useActionState } from "react";

import {
  saveDraft,
  startResearch,
  type ContentRequestFormState,
} from "@/lib/actions/content-requests";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";

const initialState: ContentRequestFormState = {};

function Field({
  id,
  label,
  required,
  error,
  helperText,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>
      {children}
      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-muted-foreground">{helperText}</p>
      ) : null}
    </div>
  );
}

export function RequestForm() {
  const [startState, startAction, startPending] = useActionState(
    startResearch,
    initialState,
  );
  const [draftState, draftAction, draftPending] = useActionState(
    saveDraft,
    initialState,
  );

  // Only one of the two actions runs per submit, so whichever state carries
  // an error/fieldErrors is the one to show.
  const state =
    startState.error || startState.fieldErrors ? startState : draftState;

  const fieldErrors = state.fieldErrors ?? {};

  return (
    <form className="space-y-6">
      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <Field id="rawIdea" label="Raw Idea" required error={fieldErrors.rawIdea}>
        <Textarea
          id="rawIdea"
          name="rawIdea"
          rows={4}
          placeholder="What do you want to write about? Share the idea in your own words."
        />
      </Field>

      <Field
        id="targetAudience"
        label="Target Audience"
        required
        error={fieldErrors.targetAudience}
      >
        <Textarea
          id="targetAudience"
          name="targetAudience"
          rows={2}
          placeholder="Describe who this content is intended for."
        />
      </Field>

      <Field
        id="supportingMaterial"
        label="Supporting Material"
        helperText="Optional — notes, context, or excerpts to inform the research."
      >
        <Textarea id="supportingMaterial" name="supportingMaterial" rows={3} />
      </Field>

      <Field
        id="sourceUrl"
        label="Source URL"
        error={fieldErrors.sourceUrl}
        helperText="Optional — a URL to research and ground the content in."
      >
        <Input
          id="sourceUrl"
          name="sourceUrl"
          type="url"
          placeholder="https://example.com/article"
        />
      </Field>

      <Field
        id="additionalInstructions"
        label="Additional Instructions"
        helperText="Optional — tone, angle, restrictions, or other requirements."
      >
        <Textarea id="additionalInstructions" name="additionalInstructions" rows={3} />
      </Field>

      <div className="flex items-center gap-3">
        <Button formAction={startAction} disabled={startPending || draftPending}>
          {startPending ? "Starting…" : "Start Research"}
        </Button>
        <Button
          type="submit"
          variant="outline"
          formAction={draftAction}
          disabled={startPending || draftPending}
        >
          {draftPending ? "Saving…" : "Save Draft"}
        </Button>
      </div>
    </form>
  );
}
