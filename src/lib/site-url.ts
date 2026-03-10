const DEFAULT_SITE_URL = "https://golfdataviz.com";

/**
 * Canonical public site URL. Prefer NEXT_PUBLIC_BASE_URL going forward.
 * NEXT_PUBLIC_SITE_URL remains as a legacy fallback for existing deploy envs.
 */
export function getSiteUrl(): string {
  const value =
    process.env.NEXT_PUBLIC_BASE_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    DEFAULT_SITE_URL;

  return value.endsWith("/") ? value.slice(0, -1) : value;
}
