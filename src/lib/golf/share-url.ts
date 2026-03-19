/**
 * Centralized share URL builder for SG round sharing.
 * Always builds encoded ?d= URLs with UTM parameters for attribution.
 */

export type ShareMedium = "copy_link" | "receipt_qr" | "cta";

const DEFAULT_BASE_URL = "https://golfdataviz.com/strokes-gained";

export function buildShareUrl(opts: {
  encodedPayload: string;
  medium: ShareMedium;
  baseUrl?: string;
}): string {
  const base = opts.baseUrl ?? DEFAULT_BASE_URL;
  const url = new URL(base);
  url.searchParams.set("d", opts.encodedPayload);
  url.searchParams.set("utm_source", "share");
  url.searchParams.set("utm_campaign", "round_share");
  url.searchParams.set("utm_medium", opts.medium);
  return url.toString();
}
