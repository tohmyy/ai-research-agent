import { ClipboardCheck } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";

export default function ReviewPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Review"
        description="Drafts and channel content waiting on a decision."
      />

      <EmptyState
        icon={ClipboardCheck}
        title="Nothing to review yet."
        description="Content appears here once it has been generated and evaluated."
      />
    </div>
  );
}
