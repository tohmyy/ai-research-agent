"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { PanelLeft, PanelLeftClose, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  PRIMARY_NAV_ITEMS,
  SECONDARY_NAV_ITEMS,
  type NavItem,
} from "./nav-items";

function NavLink({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const pathname = usePathname();
  const active = pathname.startsWith(item.href);
  const Icon = item.icon;

  const link = (
    <Link
      href={item.href}
      aria-label={item.label}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-body-medium transition-colors duration-150",
        collapsed && "justify-center px-0",
        active
          ? "bg-primary-subtle text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      <Icon className="size-4 shrink-0" />
      {!collapsed && <span>{item.label}</span>}
    </Link>
  );

  if (!collapsed) return link;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right">{item.label}</TooltipContent>
    </Tooltip>
  );
}

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        // Sticky + viewport height so Notifications/Settings stay pinned at
        // the bottom of the screen instead of below a page-tall sidebar.
        "sticky top-0 flex h-svh shrink-0 flex-col border-r border-border bg-card transition-[width] duration-150",
        collapsed ? "w-16" : "w-64",
      )}
    >
      <div
        className={cn(
          "flex h-16 shrink-0 items-center gap-2 border-b border-border px-4",
          collapsed && "justify-center px-0",
        )}
      >
        <Sparkles className="size-5 shrink-0 text-primary" />
        {!collapsed && (
          <span className="text-subsection">AI Content Agent</span>
        )}
      </div>

      <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto p-3">
        {PRIMARY_NAV_ITEMS.map((item) => (
          <NavLink key={item.href} item={item} collapsed={collapsed} />
        ))}
      </nav>

      <div className="flex shrink-0 flex-col gap-1 border-t border-border p-3">
        {SECONDARY_NAV_ITEMS.map((item) => (
          <NavLink key={item.href} item={item} collapsed={collapsed} />
        ))}

        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2 text-body-medium text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground",
            collapsed && "justify-center px-0",
          )}
        >
          {collapsed ? (
            <PanelLeft className="size-4 shrink-0" />
          ) : (
            <>
              <PanelLeftClose className="size-4 shrink-0" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
