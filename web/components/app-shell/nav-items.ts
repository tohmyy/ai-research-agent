import type { LucideIcon } from "lucide-react";
import {
  ClipboardCheck,
  FileText,
  LayoutDashboard,
  Search,
  Send,
  Settings,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

// Primary navigation — ui-design-spec.md §12.2. Do not add items beyond this
// list without an explicit product requirement (§12.2, §90).
export const PRIMARY_NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Content Requests", href: "/content-requests", icon: FileText },
  { label: "Research", href: "/research", icon: Search },
  { label: "Review", href: "/review", icon: ClipboardCheck },
  { label: "Publishing", href: "/publishing", icon: Send },
];

export const SECONDARY_NAV_ITEMS: NavItem[] = [
  { label: "Settings", href: "/settings", icon: Settings },
];
