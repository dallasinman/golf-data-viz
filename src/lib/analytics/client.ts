import { track } from "@vercel/analytics";
import type { AnalyticsEvent, AnalyticsEventProps } from "./events";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * Fire an analytics event to both Vercel Analytics and GA4.
 * No-ops when a sink is unavailable. Never throws.
 */
export function trackEvent<E extends AnalyticsEvent>(
  event: E,
  props?: AnalyticsEventProps[E]
): void {
  // Vercel Analytics
  try {
    track(event, props as Record<string, string | number | boolean | undefined>);
  } catch {
    // Vercel SDK unavailable or errored — swallow
  }

  // GA4 via gtag
  try {
    const gaId = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID;
    if (gaId && typeof window !== "undefined" && typeof window.gtag === "function") {
      window.gtag("event", event, props);
    }
  } catch {
    // gtag unavailable or errored — swallow
  }
}
