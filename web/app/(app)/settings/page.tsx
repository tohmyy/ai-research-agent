import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
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
    </div>
  );
}
