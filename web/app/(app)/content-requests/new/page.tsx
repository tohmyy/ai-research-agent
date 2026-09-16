import { PageHeader } from "@/components/page-header";
import { RequestForm } from "@/components/content-requests/request-form";

export default function NewContentRequestPage() {
  return (
    <div className="max-w-2xl space-y-8">
      <PageHeader
        title="New Content Request"
        description="Tell us what you want to create."
      />
      <RequestForm />
    </div>
  );
}
