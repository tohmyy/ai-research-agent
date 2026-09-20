import { PageHeader } from "@/components/page-header";
import { RequestForm } from "@/components/content-requests/request-form";

export default function NewContentRequestPage() {
  return (
    <div className="max-w-3xl space-y-8">
      <PageHeader
        title="New Content Request"
        description="Dump your idea, audience, links, and notes in one place."
      />
      <RequestForm />
    </div>
  );
}
