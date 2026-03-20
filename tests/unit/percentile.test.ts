import { describe, it, expect } from "vitest";
import {
  calculatePercentile,
  calculatePercentiles,
  formatOrdinal,
} from "@/lib/golf/percentile";
import type {
  StrokesGainedResult,
  StrokesGainedCategory,
  ConfidenceLevel,
  HandicapBracket,
} from "@/lib/golf/types";

/** Build a StrokesGainedResult with sensible defaults */
function makeResult(overrides: {
  total?: number;
  categories?: Partial<Record<StrokesGainedCategory, number>>;
  confidence?: Partial<Record<StrokesGainedCategory, ConfidenceLevel>>;
  skippedCategories?: StrokesGainedCategory[];
  benchmarkBracket?: HandicapBracket;
}): StrokesGainedResult {
  return {
    total: overrides.total ?? 0,
    categories: {
      "off-the-tee": 0,
      approach: 0,
      "around-the-green": 0,
      putting: 0,
      ...overrides.categories,
    },
    benchmarkBracket: overrides.benchmarkBracket ?? "10-15",
    skippedCategories: overrides.skippedCategories ?? [],
    estimatedCategories: [],
    confidence: {
      "off-the-tee": "high",
      approach: "high",
      "around-the-green": "high",
      putting: "high",
      ...overrides.confidence,
    },
    methodologyVersion: "3.2.0",
    benchmarkVersion: "1.0.0",
    benchmarkHandicap: 12,
    diagnostics: { threePuttImpact: null },
  };
}

describe("calculatePercentile", () => {
  it("SG = 0 → 50th percentile", () => {
    const p = calculatePercentile("approach", 0, "10–15 HCP");
    expect(p.percentile).toBe(50);
    expect(p.tier).toBe("average");
    expect(p.label).toBe("Better than 50% of 10–15 HCP golfers");
    expect(p.shortLabel).toBe("50th %ile");
  });

  it("SG = +1.5 approach (1 SD) → 84th percentile", () => {
    const p = calculatePercentile("approach", 1.5, "10–15 HCP");
    expect(p.percentile).toBe(84);
    expect(p.tier).toBe("top");
  });

  it("SG = -1.5 approach (−1 SD) → 16th percentile", () => {
    const p = calculatePercentile("approach", -1.5, "10–15 HCP");
    expect(p.percentile).toBe(16);
    expect(p.tier).toBe("bottom");
  });

  it("SG = +3.0 approach (2 SD) → 98th percentile", () => {
    const p = calculatePercentile("approach", 3.0, "10–15 HCP");
    expect(p.percentile).toBe(98);
    expect(p.tier).toBe("top");
  });

  it("extreme positive value clamped to 99", () => {
    const p = calculatePercentile("putting", 10.0, "10–15 HCP");
    expect(p.percentile).toBe(99);
  });

  it("extreme negative value clamped to 1", () => {
    const p = calculatePercentile("putting", -10.0, "10–15 HCP");
    expect(p.percentile).toBe(1);
  });

  it("all 4 categories produce valid results", () => {
    const categories: StrokesGainedCategory[] = [
      "off-the-tee",
      "approach",
      "around-the-green",
      "putting",
    ];
    for (const cat of categories) {
      const p = calculatePercentile(cat, 0.5, "10–15 HCP");
      expect(p.category).toBe(cat);
      expect(p.percentile).toBeGreaterThanOrEqual(1);
      expect(p.percentile).toBeLessThanOrEqual(99);
    }
  });

  it("putting has tighter SD → same SG value yields higher percentile than approach", () => {
    // putting SD = 0.8, approach SD = 1.5
    // +0.8 strokes: putting = 1 SD (84th), approach = 0.53 SD (70th)
    const putt = calculatePercentile("putting", 0.8, "10–15 HCP");
    const app = calculatePercentile("approach", 0.8, "10–15 HCP");
    expect(putt.percentile).toBeGreaterThan(app.percentile);
  });
});

describe("calculatePercentiles", () => {
  it("returns percentiles for all non-skipped categories", () => {
    const result = makeResult({
      categories: {
        "off-the-tee": 0.5,
        approach: -0.3,
        "around-the-green": 1.2,
        putting: 0.0,
      },
    });
    const percentiles = calculatePercentiles(result);
    expect(percentiles["off-the-tee"]).not.toBeNull();
    expect(percentiles.approach).not.toBeNull();
    expect(percentiles["around-the-green"]).not.toBeNull();
    expect(percentiles.putting).not.toBeNull();
    expect(percentiles.putting!.percentile).toBe(50);
  });

  it("returns null for skipped categories", () => {
    const result = makeResult({
      skippedCategories: ["off-the-tee", "around-the-green"],
    });
    const percentiles = calculatePercentiles(result);
    expect(percentiles["off-the-tee"]).toBeNull();
    expect(percentiles["around-the-green"]).toBeNull();
    expect(percentiles.approach).not.toBeNull();
    expect(percentiles.putting).not.toBeNull();
  });

  it("uses bracket label from constants for known brackets", () => {
    const result = makeResult({ benchmarkBracket: "10-15" });
    const percentiles = calculatePercentiles(result);
    expect(percentiles.approach!.label).toContain("10–15 HCP");
  });

  it("uses raw bracket string for unknown brackets", () => {
    const result = makeResult({ benchmarkBracket: "plus" });
    const percentiles = calculatePercentiles(result);
    // BRACKET_LABELS["plus"] = "Plus HCP"
    expect(percentiles.approach!.label).toContain("Plus HCP");
  });
});

describe("formatOrdinal", () => {
  it("1st, 2nd, 3rd, 4th", () => {
    expect(formatOrdinal(1)).toBe("1st");
    expect(formatOrdinal(2)).toBe("2nd");
    expect(formatOrdinal(3)).toBe("3rd");
    expect(formatOrdinal(4)).toBe("4th");
  });

  it("11th, 12th, 13th (teens are always th)", () => {
    expect(formatOrdinal(11)).toBe("11th");
    expect(formatOrdinal(12)).toBe("12th");
    expect(formatOrdinal(13)).toBe("13th");
  });

  it("21st, 22nd, 23rd", () => {
    expect(formatOrdinal(21)).toBe("21st");
    expect(formatOrdinal(22)).toBe("22nd");
    expect(formatOrdinal(23)).toBe("23rd");
  });

  it("50th, 99th", () => {
    expect(formatOrdinal(50)).toBe("50th");
    expect(formatOrdinal(99)).toBe("99th");
  });
});

describe("tier classification", () => {
  it("top: >= 75th", () => {
    const p = calculatePercentile("approach", 1.5, "10–15 HCP");
    expect(p.tier).toBe("top");
  });

  it("above-average: 55-74", () => {
    // approach SD = 1.5, SG = +0.3 → z = 0.2 → ~58th percentile
    const p = calculatePercentile("approach", 0.3, "10–15 HCP");
    expect(p.tier).toBe("above-average");
  });

  it("average: 45-54", () => {
    const p = calculatePercentile("approach", 0, "10–15 HCP");
    expect(p.tier).toBe("average");
  });

  it("below-average: 25-44", () => {
    // approach SD = 1.5, SG = -0.3 → z = -0.2 → ~42nd percentile
    const p = calculatePercentile("approach", -0.3, "10–15 HCP");
    expect(p.tier).toBe("below-average");
  });

  it("bottom: < 25th", () => {
    const p = calculatePercentile("approach", -1.5, "10–15 HCP");
    expect(p.tier).toBe("bottom");
  });
});
