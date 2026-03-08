import { describe, it, expect } from "vitest";
import { csp } from "../../src/lib/security/csp";

function getDirective(name: string): string {
  const match = csp.match(new RegExp(`${name}\\s+([^;]+)`));
  return match?.[1] ?? "";
}

describe("CSP allows GA4 data collection", () => {
  it("connect-src includes *.google-analytics.com", () => {
    expect(getDirective("connect-src")).toContain(
      "https://*.google-analytics.com"
    );
  });

  it("connect-src includes *.analytics.google.com", () => {
    expect(getDirective("connect-src")).toContain(
      "https://*.analytics.google.com"
    );
  });

  it("connect-src includes *.googletagmanager.com", () => {
    expect(getDirective("connect-src")).toContain(
      "https://*.googletagmanager.com"
    );
  });

  it("img-src includes www.googletagmanager.com", () => {
    expect(getDirective("img-src")).toContain(
      "https://www.googletagmanager.com"
    );
  });
});
