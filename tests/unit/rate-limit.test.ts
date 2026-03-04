import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  checkRateLimit,
  extractClientIp,
  hashRateLimitKey,
  InMemoryRateLimitStore,
} from "@/lib/rate-limit";

describe("rate limiter", () => {
  beforeEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  it("extracts client IP using the expected header precedence", () => {
    const headers = {
      get(name: string) {
        if (name === "x-vercel-forwarded-for") return "3.3.3.3";
        if (name === "x-forwarded-for") return "2.2.2.2";
        if (name === "cf-connecting-ip") return "1.1.1.1";
        return null;
      },
    };

    expect(extractClientIp(headers)).toBe("3.3.3.3");
  });

  it("falls back to x-forwarded-for and then cf-connecting-ip", () => {
    const headers = {
      get(name: string) {
        if (name === "x-forwarded-for") return "2.2.2.2, 2.2.2.3";
        if (name === "cf-connecting-ip") return "1.1.1.1";
        return null;
      },
    };

    expect(extractClientIp(headers)).toBe("2.2.2.2");
  });

  it("returns unknown when no client IP headers are present", () => {
    const headers = { get: () => null };
    expect(extractClientIp(headers)).toBe("unknown");
  });

  it("hashes IP keys with the RATE_LIMIT_SALT", () => {
    vi.stubEnv("RATE_LIMIT_SALT", "test-salt");
    const hashed = hashRateLimitKey("1.2.3.4");
    expect(hashed).not.toBe("1.2.3.4");
    expect(hashed).toHaveLength(64);
  });

  it("blocks the 6th request within a minute", async () => {
    const store = new InMemoryRateLimitStore();
    for (let i = 0; i < 5; i++) {
      const decision = await checkRateLimit("1.2.3.4", store);
      expect(decision).toEqual({ allowed: true });
    }

    const blocked = await checkRateLimit("1.2.3.4", store);
    expect(blocked).toEqual({ allowed: false, reason: "minute" });
  });

  it("resets the minute window after 60 seconds", async () => {
    vi.useFakeTimers();
    const store = new InMemoryRateLimitStore();

    for (let i = 0; i < 6; i++) {
      await checkRateLimit("1.2.3.4", store);
    }
    expect(await checkRateLimit("1.2.3.4", store)).toEqual({
      allowed: false,
      reason: "minute",
    });

    vi.advanceTimersByTime(61_000);
    expect(await checkRateLimit("1.2.3.4", store)).toEqual({ allowed: true });
  });

  it("blocks the 31st request within an hour", async () => {
    vi.useFakeTimers();
    const store = new InMemoryRateLimitStore();

    for (let i = 0; i < 30; i++) {
      const decision = await checkRateLimit("1.2.3.4", store);
      expect(decision).toEqual({ allowed: true });
      vi.advanceTimersByTime(61_000);
    }

    const blocked = await checkRateLimit("1.2.3.4", store);
    expect(blocked).toEqual({ allowed: false, reason: "hour" });
  });

  it("tracks IPs independently", async () => {
    const store = new InMemoryRateLimitStore();
    for (let i = 0; i < 6; i++) {
      await checkRateLimit("1.1.1.1", store);
    }

    expect(await checkRateLimit("1.1.1.1", store)).toEqual({
      allowed: false,
      reason: "minute",
    });
    expect(await checkRateLimit("2.2.2.2", store)).toEqual({ allowed: true });
  });
});
