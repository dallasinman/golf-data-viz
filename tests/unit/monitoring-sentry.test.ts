import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const { mockCaptureException } = vi.hoisted(() => ({
  mockCaptureException: vi.fn(),
}));

vi.mock("@sentry/nextjs", () => ({
  captureException: mockCaptureException,
}));

import { captureMonitoringException } from "@/lib/monitoring/sentry";

describe("captureMonitoringException", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("no-ops when no Sentry DSN is configured", () => {
    captureMonitoringException(new Error("boom"));
    expect(mockCaptureException).not.toHaveBeenCalled();
  });

  it("captures exception when SENTRY_DSN is set", () => {
    vi.stubEnv("SENTRY_DSN", "https://example@o0.ingest.sentry.io/1");
    const err = new Error("boom");
    captureMonitoringException(err, { source: "saveRound" });

    expect(mockCaptureException).toHaveBeenCalledWith(err, {
      extra: { source: "saveRound" },
    });
  });

  it("captures exception when NEXT_PUBLIC_SENTRY_DSN is set", () => {
    vi.stubEnv(
      "NEXT_PUBLIC_SENTRY_DSN",
      "https://example@o0.ingest.sentry.io/2"
    );
    const err = new Error("boom");
    captureMonitoringException(err);

    expect(mockCaptureException).toHaveBeenCalledWith(err, undefined);
  });
});
