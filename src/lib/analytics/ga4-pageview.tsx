"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Fires a sanitized GA4 page_view on every route change.
 * Uses pathname only (no query params) to avoid leaking ?d= round data.
 * No-ops when gtag is unavailable.
 */
export function GA4PageView() {
  const pathname = usePathname();

  useEffect(() => {
    try {
      if (typeof window !== "undefined" && typeof window.gtag === "function") {
        const pageLocation = window.location.origin + pathname;
        window.gtag("event", "page_view", {
          page_location: pageLocation,
          page_path: pathname,
        });
      }
    } catch {
      // gtag unavailable — swallow
    }
  }, [pathname]);

  return null;
}
