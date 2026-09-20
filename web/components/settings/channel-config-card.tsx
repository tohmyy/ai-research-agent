"use client";

import { useState } from "react";

import { saveChannelConfig } from "@/lib/actions/channel-configs";
import { useAsyncAction } from "@/hooks/use-async-action";
import { InlineError } from "@/components/inline-error";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type ChannelConfigField = {
  key: string;
  label: string;
  placeholder?: string;
  type?: "text" | "select";
  options?: { value: string; label: string }[];
  defaultValue?: string;
};

export function ChannelConfigCard({
  channel,
  title,
  description,
  fields,
  initialEnabled,
  initialConfig,
}: {
  channel: string;
  title: string;
  description: string;
  fields: ChannelConfigField[];
  initialEnabled: boolean;
  initialConfig: Record<string, string>;
}) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [values, setValues] = useState<Record<string, string>>(() => {
    const seeded: Record<string, string> = {};
    for (const field of fields) {
      seeded[field.key] = initialConfig[field.key] ?? field.defaultValue ?? "";
    }
    return seeded;
  });
  const { pending, error, run } = useAsyncAction();

  function handleSave() {
    run(async () => {
      await saveChannelConfig(channel, enabled, values);
    }, `${title} settings saved.`);
  }

  return (
    <Card className="border-border bg-card shadow-subtle">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-subsection">{title}</CardTitle>
          <p className="mt-1 text-caption text-muted-foreground">{description}</p>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor={`${channel}-enabled`} className="text-small text-muted-foreground">
            Enabled
          </Label>
          <Switch id={`${channel}-enabled`} checked={enabled} onCheckedChange={setEnabled} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && <InlineError message={error} />}
        {fields.map((field) => (
          <div key={field.key} className="space-y-1.5">
            <Label htmlFor={`${channel}-${field.key}`}>{field.label}</Label>
            {field.type === "select" ? (
              <Select
                value={values[field.key] ?? ""}
                onValueChange={(value) =>
                  setValues((prev) => ({ ...prev, [field.key]: value }))
                }
              >
                <SelectTrigger id={`${channel}-${field.key}`} className="w-full">
                  <SelectValue placeholder={field.placeholder} />
                </SelectTrigger>
                <SelectContent>
                  {field.options?.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id={`${channel}-${field.key}`}
                value={values[field.key] ?? ""}
                placeholder={field.placeholder}
                onChange={(e) =>
                  setValues((prev) => ({ ...prev, [field.key]: e.target.value }))
                }
              />
            )}
          </div>
        ))}
        <div className="flex justify-end">
          <Button size="sm" onClick={handleSave} disabled={pending}>
            {pending ? "Saving…" : "Save Changes"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
