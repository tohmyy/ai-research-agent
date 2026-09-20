"use client";

import { useActionState, useMemo, useState, useTransition } from "react";

import {
  parseIntake,
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

type SummaryFields = {
  rawIdea: string;
  targetAudience: string;
  supportingMaterial: string;
  sourceUrl: string;
  additionalInstructions: string;
};

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

function validateSummary(fields: SummaryFields): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  if (!fields.rawIdea.trim()) {
    fieldErrors.rawIdea = "Describe the content idea.";
  }
  if (!fields.targetAudience.trim()) {
    fieldErrors.targetAudience = "Describe who this content is for.";
  }
  if (fields.sourceUrl.trim()) {
    try {
      new URL(fields.sourceUrl.trim());
    } catch {
      fieldErrors.sourceUrl = "Enter a valid URL, including https://.";
    }
  }
  return fieldErrors;
}

export function RequestForm() {
  const [stage, setStage] = useState<"compose" | "summary">("compose");
  const [prompt, setPrompt] = useState("");
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsing, startParseTransition] = useTransition();
  const [fields, setFields] = useState<SummaryFields>({
    rawIdea: "",
    targetAudience: "",
    supportingMaterial: "",
    sourceUrl: "",
    additionalInstructions: "",
  });
  const [clientFieldErrors, setClientFieldErrors] = useState<
    Record<string, string>
  >({});

  const [startState, startAction, startPending] = useActionState(
    startResearch,
    initialState,
  );
  const [draftState, draftAction, draftPending] = useActionState(
    saveDraft,
    initialState,
  );

  const state =
    startState.error || startState.fieldErrors ? startState : draftState;
  const fieldErrors = {
    ...clientFieldErrors,
    ...(state.fieldErrors ?? {}),
  };

  const summaryReady = useMemo(
    () => Object.keys(validateSummary(fields)).length === 0,
    [fields],
  );

  function handleContinue() {
    setParseError(null);
    startParseTransition(async () => {
      const result = await parseIntake(prompt);
      if (!result.ok) {
        setParseError(result.error);
        return;
      }

      const next: SummaryFields = {
        rawIdea: result.fields.raw_idea,
        targetAudience: result.fields.target_audience,
        supportingMaterial: result.fields.supporting_material,
        sourceUrl: result.fields.source_url,
        additionalInstructions: result.fields.additional_instructions,
      };
      setFields(next);
      setClientFieldErrors(validateSummary(next));
      setStage("summary");
    });
  }

  function handleBack() {
    setParseError(null);
    setClientFieldErrors({});
    setStage("compose");
  }

  function updateField<K extends keyof SummaryFields>(
    key: K,
    value: SummaryFields[K],
  ) {
    setFields((prev) => {
      const next = { ...prev, [key]: value };
      setClientFieldErrors(validateSummary(next));
      return next;
    });
  }

  if (stage === "compose") {
    return (
      <div className="space-y-6">
        {(parseError || state.error) && (
          <Alert variant="destructive">
            <AlertDescription>{parseError ?? state.error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-3">
          <Label htmlFor="intakePrompt" className="sr-only">
            Content request
          </Label>
          <Textarea
            id="intakePrompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={10}
            className="min-h-48 resize-y text-base leading-relaxed"
            placeholder="Dump your idea, who it's for, any links, tone, and notes in one place…"
            disabled={parsing}
          />
          <p className="text-xs text-muted-foreground">
            No need to split fields yet — we&apos;ll organize this for you.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            onClick={handleContinue}
            disabled={parsing || !prompt.trim()}
          >
            {parsing ? "Understanding…" : "Continue"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form className="space-y-6">
      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-1">
        <h2 className="text-subsection font-semibold tracking-[-0.01em]">
          Here&apos;s what we understood
        </h2>
        <p className="text-sm text-muted-foreground">
          Edit anything that looks off before starting research.
        </p>
      </div>

      <Field id="rawIdea" label="Raw Idea" required error={fieldErrors.rawIdea}>
        <Textarea
          id="rawIdea"
          name="rawIdea"
          rows={4}
          value={fields.rawIdea}
          onChange={(e) => updateField("rawIdea", e.target.value)}
          placeholder="What do you want to write about?"
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
          value={fields.targetAudience}
          onChange={(e) => updateField("targetAudience", e.target.value)}
          placeholder="Describe who this content is intended for."
        />
      </Field>

      <Field
        id="supportingMaterial"
        label="Supporting Material"
        helperText="Optional — notes, context, or excerpts to inform the research."
      >
        <Textarea
          id="supportingMaterial"
          name="supportingMaterial"
          rows={3}
          value={fields.supportingMaterial}
          onChange={(e) => updateField("supportingMaterial", e.target.value)}
        />
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
          value={fields.sourceUrl}
          onChange={(e) => updateField("sourceUrl", e.target.value)}
          placeholder="https://example.com/article"
        />
      </Field>

      <Field
        id="additionalInstructions"
        label="Additional Instructions"
        helperText="Optional — tone, angle, restrictions, or other requirements."
      >
        <Textarea
          id="additionalInstructions"
          name="additionalInstructions"
          rows={3}
          value={fields.additionalInstructions}
          onChange={(e) =>
            updateField("additionalInstructions", e.target.value)
          }
        />
      </Field>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          formAction={startAction}
          disabled={startPending || draftPending || !summaryReady}
        >
          {startPending ? "Starting…" : "Start Research"}
        </Button>
        <Button
          type="submit"
          variant="outline"
          formAction={draftAction}
          disabled={startPending || draftPending || !summaryReady}
        >
          {draftPending ? "Saving…" : "Save Draft"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={handleBack}
          disabled={startPending || draftPending}
        >
          Back
        </Button>
      </div>
    </form>
  );
}
