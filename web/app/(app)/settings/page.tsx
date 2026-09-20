import { db } from "@/lib/db";
import { channelConfigs } from "@/lib/db/schema";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChannelConfigCard,
  type ChannelConfigField,
} from "@/components/settings/channel-config-card";

const CHANNEL_FIELDS: Record<
  string,
  { title: string; description: string; fields: ChannelConfigField[] }
> = {
  linkedin: {
    title: "LinkedIn",
    description: "Posts approved content to LinkedIn on your behalf.",
    fields: [
      { key: "accessToken", label: "Access Token" },
      { key: "authorUrn", label: "Author URN", placeholder: "urn:li:person:..." },
    ],
  },
  x: {
    title: "X",
    description: "Posts approved content to X (Twitter) on your behalf.",
    fields: [
      { key: "apiKey", label: "API Key" },
      { key: "apiSecret", label: "API Secret" },
      { key: "accessToken", label: "Access Token" },
      { key: "accessTokenSecret", label: "Access Token Secret" },
    ],
  },
  newsletter: {
    title: "Newsletter",
    description: "Sends the approved newsletter to your audience by email.",
    fields: [
      {
        key: "provider",
        label: "Email Provider",
        type: "select",
        defaultValue: "resend",
        options: [
          { value: "resend", label: "Resend" },
          { value: "sendgrid", label: "SendGrid" },
        ],
      },
      { key: "apiKey", label: "API Key" },
      { key: "fromEmail", label: "From Email", placeholder: "you@yourcompany.com" },
      {
        key: "recipients",
        label: "Recipients",
        placeholder: "comma-separated email addresses",
      },
    ],
  },
};

const CHANNEL_ORDER = ["linkedin", "x", "newsletter"];

export default async function SettingsPage() {
  const configs = await db.select().from(channelConfigs);
  const byChannel = new Map(configs.map((c) => [c.channel, c]));

  return (
    <div className="space-y-8">
      <PageHeader
        title="Settings"
        description="Account and workspace configuration."
      />

      <Card className="border-border bg-card shadow-subtle">
        <CardHeader>
          <CardTitle className="text-subsection">Account</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-body text-muted-foreground">
            Additional settings will be added as the workspace grows.
          </p>
        </CardContent>
      </Card>

      <section className="space-y-4">
        <h2 className="text-section-title font-semibold tracking-[-0.01em]">Channels</h2>
        <p className="text-body text-muted-foreground">
          Configure the channels approved content can be adapted for and published to.
        </p>
        <div className="grid gap-4 lg:grid-cols-3">
          {CHANNEL_ORDER.map((channel) => {
            const meta = CHANNEL_FIELDS[channel]!;
            const row = byChannel.get(channel);
            return (
              <ChannelConfigCard
                key={channel}
                channel={channel}
                title={meta.title}
                description={meta.description}
                fields={meta.fields}
                initialEnabled={row?.enabled ?? false}
                initialConfig={(row?.config as Record<string, string>) ?? {}}
              />
            );
          })}
        </div>
      </section>
    </div>
  );
}
