import { Send } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";

export default function PublishingPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Publishing"
        description="Approved content that is queued, scheduled, or published."
      />

      <EmptyState
        icon={Send}
        title="Publishing queue is empty."
        description="Approved content will appear here, ready to publish or schedule."
      />
    </div>
  );
}
