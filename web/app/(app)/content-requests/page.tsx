import { FileText } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";

export default function ContentRequestsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Content Requests"
        description="Every idea or source submitted for research and drafting."
        action={<Button disabled>New Content Request</Button>}
      />

      <EmptyState
        icon={FileText}
        title="No content requests yet."
        description="The content request form arrives in the next build phase."
      />
    </div>
  );
}
