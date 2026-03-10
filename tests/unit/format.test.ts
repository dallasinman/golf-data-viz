import { describe, it, expect } from "vitest";
import { formatCompactDate, formatHandicap } from "@/lib/golf/format";

describe("formatHandicap", () => {
  it("formats plus handicap with + prefix", () => {
    expect(formatHandicap(-2.3)).toBe("+2.3");
  });

  it("formats zero as 0.0", () => {
    expect(formatHandicap(0)).toBe("0.0");
  });

  it("formats standard handicap without prefix", () => {
    expect(formatHandicap(14.3)).toBe("14.3");
  });

  it("formats -9.9 as +9.9", () => {
    expect(formatHandicap(-9.9)).toBe("+9.9");
  });

  it("formats -0.1 as +0.1", () => {
    expect(formatHandicap(-0.1)).toBe("+0.1");
  });

  it("formats whole numbers with one decimal", () => {
    expect(formatHandicap(10)).toBe("10.0");
  });
});

describe("formatCompactDate", () => {
  it("formats a YYYY-MM-DD value for compact UI display", () => {
    expect(formatCompactDate("2026-03-01")).toBe("Mar 1, 2026");
  });
});
