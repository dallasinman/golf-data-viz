import { describe, it, expect } from "vitest";
import { generateShareHeadline } from "@/lib/golf/share-headline";
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

const defaultMeta = { score: 87, courseName: "Pebble Beach" };

describe("generateShareHeadline", () => {
  describe("pattern selection", () => {
    it("fires score-only when <= 1 active category", () => {
      const result = makeResult({
        confidence: {
          "off-the-tee": "low",
          approach: "low",
          "around-the-green": "low",
          putting: "low",
        },
      });
      const h = generateShareHeadline(result, defaultMeta);
      expect(h.pattern).toBe("score-only");
      expect(h.line).toBe("Shot 87 at Pebble Beach");
    });

    it("fires skull when worst category <= -2.0", () => {
      // total = -4.20 -> variant = 420 % 2 = 0
      const result = makeResult({
        total: -4.2,
        categories: { putting: -4.2 },
      });
      const h = generateShareHeadline(result, defaultMeta);
      expect(h.pattern).toBe("skull");
      expect(h.line).toBe("Lost 4.2 strokes putting");
    });

    it("fires split when spread >= 2.5 and no skull", () => {
      // approach +1.5, putting -1.2 -> spread 2.7, worst -1.2 > -2.0
      // total = 0.30 -> variant = 30 % 2 = 0
      const result = makeResult({
        total: 0.3,
        categories: { approach: 1.5, putting: -1.2 },
      });
      const h = generateShareHeadline(result, defaultMeta);
      expect(h.pattern).toBe("split");
      expect(h.line).toBe("Approach: +1.5. Putting: -1.2.");
    });

    it("fires weapon when best >= 2.0 and no skull/split", () => {
      // approach +2.5, others mild positive -> spread 2.4, no skull
      // total = 3.00 -> variant = 300 % 2 = 0
      const result = makeResult({
        total: 3.0,
        categories: {
          approach: 2.5,
          putting: 0.3,
          "off-the-tee": 0.1,
          "around-the-green": 0.1,
        },
      });
      const h = generateShareHeadline(result, defaultMeta);
      expect(h.pattern).toBe("weapon");
      expect(h.line).toBe("Gained 2.5 strokes on approach");
    });

    it("fires verdict when |total| >= 1.5 and no skull/split/weapon", () => {
      // all mild positives, total = 1.60 -> variant = 160 % 2 = 0
      const result = makeResult({
        total: 1.6,
        categories: {
          "off-the-tee": 0.8,
          approach: 0.5,
          "around-the-green": 0.2,
          putting: 0.1,
        },
      });
      const h = generateShareHeadline(result, defaultMeta);
      expect(h.pattern).toBe("verdict");
      expect(h.line).toContain("Beat my");
      expect(h.line).toContain("1.6 strokes");
    });

    it("fires shrug as fallback", () => {
      // tiny values, |total| < 1.5, no skull/split/weapon
      // total = 0.02 -> variant = 2 % 2 = 0, total > 0 -> positive shrug
      const result = makeResult({
        total: 0.02,
        categories: {
          "off-the-tee": 0.1,
          approach: 0.1,
          "around-the-green": -0.1,
          putting: -0.1,
        },
      });
      const h = generateShareHeadline(result, defaultMeta);
      expect(h.pattern).toBe("shrug");
    });
  });

  describe("sentiment", () => {
    it("skull -> negative", () => {
      const result = makeResult({
        total: -4.2,
        categories: { putting: -4.2 },
      });
      expect(generateShareHeadline(result, defaultMeta).sentiment).toBe(
        "negative",
      );
    });

    it("split -> neutral", () => {
      const result = makeResult({
        total: 0.3,
        categories: { approach: 1.5, putting: -1.2 },
      });
      expect(generateShareHeadline(result, defaultMeta).sentiment).toBe(
        "neutral",
      );
    });

    it("weapon -> positive", () => {
      const result = makeResult({
        total: 3.0,
        categories: {
          approach: 2.5,
          putting: 0.3,
          "off-the-tee": 0.1,
          "around-the-green": 0.1,
        },
      });
      expect(generateShareHeadline(result, defaultMeta).sentiment).toBe(
        "positive",
      );
    });

    it("verdict (total > 0) -> positive", () => {
      const result = makeResult({
        total: 1.6,
        categories: {
          "off-the-tee": 0.8,
          approach: 0.5,
          "around-the-green": 0.2,
          putting: 0.1,
        },
      });
      expect(generateShareHeadline(result, defaultMeta).sentiment).toBe(
        "positive",
      );
    });

    it("verdict (total < 0) -> negative", () => {
      // total = -2.10 -> variant = 210 % 2 = 0
      const result = makeResult({
        total: -2.1,
        categories: {
          "off-the-tee": -0.5,
          approach: -0.6,
          "around-the-green": -0.5,
          putting: -0.5,
        },
      });
      expect(generateShareHeadline(result, defaultMeta).sentiment).toBe(
        "negative",
      );
    });

    it("shrug (total > 0) -> positive with 'Solid'", () => {
      const result = makeResult({
        total: 0.02,
        categories: {
          "off-the-tee": 0.1,
          approach: 0.1,
          "around-the-green": -0.1,
          putting: -0.1,
        },
      });
      const h = generateShareHeadline(result, defaultMeta);
      expect(h.sentiment).toBe("positive");
      expect(h.line).toContain("Solid");
    });

    it("shrug (total <= 0) -> neutral with 'Dead average'", () => {
      // total = -0.02 -> variant = 2 % 2 = 0
      const result = makeResult({
        total: -0.02,
        categories: {
          "off-the-tee": -0.1,
          approach: -0.1,
          "around-the-green": 0.1,
          putting: 0.1,
        },
      });
      const h = generateShareHeadline(result, defaultMeta);
      expect(h.sentiment).toBe("neutral");
      expect(h.line).toContain("Dead average");
    });

    it("score-only -> neutral", () => {
      const result = makeResult({
        confidence: {
          "off-the-tee": "low",
          approach: "low",
          "around-the-green": "low",
          putting: "low",
        },
      });
      expect(generateShareHeadline(result, defaultMeta).sentiment).toBe(
        "neutral",
      );
    });
  });

  describe("confidence gating", () => {
    it("excludes low-confidence category from skull pattern", () => {
      // putting is -4.2 but low confidence -> excluded from active
      // Falls through to verdict (|total| >= 1.5)
      const result = makeResult({
        total: -3.5,
        categories: {
          "off-the-tee": 0.5,
          approach: 0.3,
          "around-the-green": -0.1,
          putting: -4.2,
        },
        confidence: { putting: "low" },
      });
      const h = generateShareHeadline(result, defaultMeta);
      expect(h.pattern).not.toBe("skull");
      expect(h.pattern).toBe("verdict");
    });
  });

  describe("skipped categories", () => {
    it("excludes skipped categories from pattern selection", () => {
      // putting = -5.0 but skipped -> excluded
      const result = makeResult({
        total: -4.7,
        categories: {
          "off-the-tee": 0.1,
          approach: 0.1,
          "around-the-green": 0.1,
          putting: -5.0,
        },
        skippedCategories: ["putting"],
      });
      const h = generateShareHeadline(result, defaultMeta);
      expect(h.pattern).not.toBe("skull");
      expect(h.pattern).toBe("verdict");
    });
  });

  describe("determinism", () => {
    it("same input produces same output", () => {
      const result = makeResult({
        total: -4.2,
        categories: { putting: -4.2 },
      });
      const h1 = generateShareHeadline(result, defaultMeta);
      const h2 = generateShareHeadline(result, defaultMeta);
      expect(h1).toEqual(h2);
    });
  });

  describe("emoji constraints", () => {
    const emojiRegex =
      /[\u{1F300}-\u{1F9FF}\u{2702}-\u{27B0}\u{24C2}-\u{1F251}\u{1FA00}-\u{1FAFF}]/u;

    it("line contains no emoji characters", () => {
      const testCases = [
        // skull
        makeResult({ total: -4.2, categories: { putting: -4.2 } }),
        // split
        makeResult({
          total: 0.3,
          categories: { approach: 1.5, putting: -1.2 },
        }),
        // weapon
        makeResult({
          total: 3.0,
          categories: {
            approach: 2.5,
            putting: 0.3,
            "off-the-tee": 0.1,
            "around-the-green": 0.1,
          },
        }),
        // verdict
        makeResult({
          total: 1.6,
          categories: {
            "off-the-tee": 0.8,
            approach: 0.5,
            "around-the-green": 0.2,
            putting: 0.1,
          },
        }),
        // shrug
        makeResult({
          total: 0.02,
          categories: {
            "off-the-tee": 0.1,
            approach: 0.1,
            "around-the-green": -0.1,
            putting: -0.1,
          },
        }),
        // score-only
        makeResult({
          confidence: {
            "off-the-tee": "low",
            approach: "low",
            "around-the-green": "low",
            putting: "low",
          },
        }),
      ];

      for (const r of testCases) {
        const h = generateShareHeadline(r, defaultMeta);
        expect(h.line).not.toMatch(emojiRegex);
      }
    });

    it("clipboardPrefix contains emoji for skull/weapon/verdict/shrug", () => {
      const skull = generateShareHeadline(
        makeResult({ total: -4.2, categories: { putting: -4.2 } }),
        defaultMeta,
      );
      expect(skull.clipboardPrefix).toMatch(emojiRegex);

      const weapon = generateShareHeadline(
        makeResult({
          total: 3.0,
          categories: {
            approach: 2.5,
            putting: 0.3,
            "off-the-tee": 0.1,
            "around-the-green": 0.1,
          },
        }),
        defaultMeta,
      );
      expect(weapon.clipboardPrefix).toMatch(emojiRegex);

      const verdict = generateShareHeadline(
        makeResult({
          total: 1.6,
          categories: {
            "off-the-tee": 0.8,
            approach: 0.5,
            "around-the-green": 0.2,
            putting: 0.1,
          },
        }),
        defaultMeta,
      );
      expect(verdict.clipboardPrefix).toMatch(emojiRegex);

      const shrug = generateShareHeadline(
        makeResult({
          total: 0.02,
          categories: {
            "off-the-tee": 0.1,
            approach: 0.1,
            "around-the-green": -0.1,
            putting: -0.1,
          },
        }),
        defaultMeta,
      );
      expect(shrug.clipboardPrefix).toMatch(emojiRegex);
    });
  });

  describe("line length", () => {
    it("line is under 70 chars for all patterns", () => {
      const testCases = [
        makeResult({ total: -4.2, categories: { putting: -4.2 } }),
        makeResult({
          total: 0.3,
          categories: { approach: 1.5, putting: -1.2 },
        }),
        makeResult({
          total: 3.0,
          categories: {
            approach: 2.5,
            putting: 0.3,
            "off-the-tee": 0.1,
            "around-the-green": 0.1,
          },
        }),
        makeResult({
          total: 1.6,
          categories: {
            "off-the-tee": 0.8,
            approach: 0.5,
            "around-the-green": 0.2,
            putting: 0.1,
          },
        }),
        makeResult({
          total: 0.02,
          categories: {
            "off-the-tee": 0.1,
            approach: 0.1,
            "around-the-green": -0.1,
            putting: -0.1,
          },
        }),
        makeResult({
          confidence: {
            "off-the-tee": "low",
            approach: "low",
            "around-the-green": "low",
            putting: "low",
          },
        }),
      ];

      for (const r of testCases) {
        const h = generateShareHeadline(r, defaultMeta);
        expect(h.line.length).toBeLessThanOrEqual(70);
      }
    });

    it("worst-case split with Off the Tee + Around the Green stays under 70", () => {
      // v0 (total = 0.20 -> variant 0): "Off the Tee: +1.8. Around the Green: -0.8."
      const v0 = makeResult({
        total: 0.2,
        categories: {
          "off-the-tee": 1.8,
          "around-the-green": -0.8,
          approach: -0.5,
          putting: -0.3,
        },
      });
      const h0 = generateShareHeadline(v0, defaultMeta);
      expect(h0.pattern).toBe("split");
      expect(h0.line.length).toBeLessThanOrEqual(70);

      // v1 (total = 0.21 -> variant 1): "My off the tee is 2.6 strokes ahead of my around the green"
      const v1 = makeResult({
        total: 0.21,
        categories: {
          "off-the-tee": 1.8,
          "around-the-green": -0.8,
          approach: -0.5,
          putting: -0.3,
        },
      });
      const h1 = generateShareHeadline(v1, defaultMeta);
      expect(h1.pattern).toBe("split");
      expect(h1.line.length).toBeLessThanOrEqual(70);
    });
  });

  describe("no signed zero in output", () => {
    it("split pattern does not produce +0.0 or -0.0", () => {
      // Force a split with one near-zero category
      const result = makeResult({
        total: 0.3,
        categories: {
          approach: 1.5,
          putting: -1.2,
          "off-the-tee": 0.03,
          "around-the-green": -0.03,
        },
      });
      const h = generateShareHeadline(result, defaultMeta);
      expect(h.line).not.toMatch(/[+-]0\.0/);
      expect(h.clipboardPrefix).not.toMatch(/[+-]0\.0/);
    });

    it("shrug pattern clipboard does not produce +0.0 or -0.0", () => {
      const result = makeResult({
        total: 0.02,
        categories: {
          "off-the-tee": 0.03,
          approach: 0.03,
          "around-the-green": -0.03,
          putting: -0.01,
        },
      });
      const h = generateShareHeadline(result, defaultMeta);
      expect(h.line).not.toMatch(/[+-]0\.0/);
      expect(h.clipboardPrefix).not.toMatch(/[+-]0\.0/);
    });
  });

  describe("edge cases", () => {
    it("all positive categories -> shrug positive", () => {
      const result = makeResult({
        total: 1.4,
        categories: {
          "off-the-tee": 0.5,
          approach: 0.4,
          "around-the-green": 0.3,
          putting: 0.2,
        },
      });
      const h = generateShareHeadline(result, defaultMeta);
      expect(h.pattern).toBe("shrug");
      expect(h.sentiment).toBe("positive");
    });

    it("all negative categories -> shrug neutral", () => {
      const result = makeResult({
        total: -1.4,
        categories: {
          "off-the-tee": -0.5,
          approach: -0.4,
          "around-the-green": -0.3,
          putting: -0.2,
        },
      });
      const h = generateShareHeadline(result, defaultMeta);
      expect(h.pattern).toBe("shrug");
      expect(h.sentiment).toBe("neutral");
    });

    it("all categories skipped -> score-only", () => {
      const result = makeResult({
        total: 0,
        skippedCategories: [
          "off-the-tee",
          "approach",
          "around-the-green",
          "putting",
        ],
      });
      const h = generateShareHeadline(result, defaultMeta);
      expect(h.pattern).toBe("score-only");
    });

    it("medium confidence still participates", () => {
      const result = makeResult({
        total: -3.0,
        categories: {
          putting: -3.0,
          "off-the-tee": 0.1,
          approach: 0.1,
          "around-the-green": -0.2,
        },
        confidence: { putting: "medium" },
      });
      const h = generateShareHeadline(result, defaultMeta);
      expect(h.pattern).toBe("skull");
    });
  });

  describe("presentation trust", () => {
    it("falls back to neutral patterns for caveated rounds", () => {
      const result = makeResult({
        total: 0.4,
        categories: {
          approach: 2.5,
          putting: 0.3,
          "off-the-tee": 0.1,
          "around-the-green": -0.1,
        },
      });

      const headline = generateShareHeadline(result, defaultMeta, {
        presentationTrust: {
          mode: "caveated",
          promotableCategories: ["off-the-tee"],
          roundReasons: ["atg_fallback_additional_suppression"],
          categoryReasons: {
            approach: ["atg_fallback_scoring_divergence"],
            putting: ["atg_fallback_approach_instability"],
            "around-the-green": ["atg_fallback"],
          },
        },
      });

      expect(["verdict", "shrug", "score-only"]).toContain(headline.pattern);
      expect(headline.pattern).not.toBe("weapon");
      expect(headline.pattern).not.toBe("skull");
      expect(headline.pattern).not.toBe("split");
    });
  });
});
