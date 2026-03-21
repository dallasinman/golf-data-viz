import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
import { csp, reportUri } from "./src/lib/security/csp";

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  { key: "Content-Security-Policy", value: csp },
  ...(reportUri
    ? [{ key: "Reporting-Endpoints", value: `csp-endpoint="${reportUri}"` }]
    : []),
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: "https://us-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://us.i.posthog.com/:path*",
      },
    ];
  },
  // Required for PostHog /ingest proxy — without this, Next.js redirects
  // /ingest/e to /ingest/e/ before the rewrite can match.
  skipTrailingSlashRedirect: true,
};

export default withSentryConfig(nextConfig, {
  silent: true,
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },
});
