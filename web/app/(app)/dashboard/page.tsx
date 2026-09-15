import Link from "next/link";
import { LayoutDashboard } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Content Dashboard"
        description="Overview of your content pipeline and publishing activity."
        action={
          <Button asChild>
            <Link href="/content-requests">New Content Request</Link>
          </Button>
        }
      />

      <EmptyState
        icon={LayoutDashboard}
        title="No content requests yet."
        description="Start your first content request to begin researching and generating content."
        action={
          <Button asChild>
            <Link href="/content-requests">New Content Request</Link>
          </Button>
        }
      />
    </div>
  );
}
