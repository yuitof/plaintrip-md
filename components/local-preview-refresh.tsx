"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LocalPreviewRefresh({ version }: { version: number }) {
  const router = useRouter();

  useEffect(() => {
    let active = true;
    let seenVersion = version;
    const interval = window.setInterval(async () => {
      try {
        const response = await fetch("/api/local-preview/version", { cache: "no-store" });
        if (!response.ok) return;
        const value = await response.json() as { version?: unknown };
        if (!active || typeof value.version !== "number" || value.version === seenVersion) {
          return;
        }
        seenVersion = value.version;
        router.refresh();
      } catch {
        // The next poll retries while the local development server is running.
      }
    }, 750);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [router, version]);

  return null;
}
