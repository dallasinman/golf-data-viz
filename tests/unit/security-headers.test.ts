import { describe, it, expect } from "vitest";
import nextConfig from "../../next.config";

function getCspValue(): Promise<string> {
  return nextConfig.headers!().then((routes) => {
    const catchAll = routes.find((r) => r.source === "/(.*)");
    const header = catchAll!.headers.find(
      (h) => h.key === "Content-Security-Policy"
    );
    return header!.value;
  });
}

describe("security headers", () => {
  it("serves a CSP header on all routes", async () => {
    const value = await getCspValue();
    expect(value).toBeDefined();
  });

  it("locks down defaults and framing", async () => {
    const value = await getCspValue();
    expect(value).toContain("default-src 'self'");
    expect(value).toContain("object-src 'none'");
    expect(value).toContain("base-uri 'self'");
    expect(value).toContain("form-action 'self'");
    expect(value).toContain("frame-ancestors 'none'");
    expect(value).not.toContain("default-src 'self' blob:");
  });

  it("allows required script sources", async () => {
    const value = await getCspValue();
    expect(value).toContain("https://www.googletagmanager.com");
    expect(value).toContain("https://va.vercel-scripts.com");
    expect(value).toContain("https://challenges.cloudflare.com");
  });

  it("allows required connect sources", async () => {
    const value = await getCspValue();
    expect(value).toContain("https://*.supabase.co");
    expect(value).toContain("https://*.google-analytics.com");
    expect(value).toContain("https://*.analytics.google.com");
    expect(value).toContain("https://*.googletagmanager.com");
    expect(value).toContain("https://vitals.vercel-insights.com");
    expect(value).toContain("https://*.ingest.sentry.io");
  });

  it("allows required frame sources", async () => {
    const value = await getCspValue();
    expect(value).toContain("https://challenges.cloudflare.com");
  });
});
