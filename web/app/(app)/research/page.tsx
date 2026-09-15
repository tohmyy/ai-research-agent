import { Search } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";

export default function ResearchPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Research"
        description="Sources gathered for content currently in progress."
      />

      <EmptyState
        icon={Search}
        title="No research activity yet."
        description="Research begins automatically once a content request is submitted."
      />
    </div>
  );
}
