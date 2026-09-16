"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Polls the server for fresh data while a background pipeline stage is
 * still in progress. Renders nothing — just refetches the current route's
 * server data every `intervalMs`. */
export function LiveRefresh({
  active,
  intervalMs = 2000,
}: {
  active: boolean;
  intervalMs?: number;
}) {
  const router = useRouter();

  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => router.refresh(), intervalMs);
    return () => clearInterval(id);
  }, [active, intervalMs, router]);

  return null;
}
