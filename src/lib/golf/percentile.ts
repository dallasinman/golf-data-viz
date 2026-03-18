import type { StrokesGainedCategory, StrokesGainedResult } from "./types";
import { BRACKET_LABELS, CATEGORY_ORDER } from "./constants";

// Within-bracket SG standard deviations (strokes/round)
// Source: Lou Stagner / Shot Scope aggregate amateur data estimates
// TODO: validate with actual user data at 100+ rounds per bracket
const CATEGORY_SD: Record<StrokesGainedCategory, number> = {
  "off-the-tee": 1.2,
  approach: 1.5,
  "around-the-green": 1.0,
  putting: 0.8,
};

export type PercentileTier = "top" | "above-average" | "average" | "below-average" | "bottom";

export interface PercentileResult {
  category: StrokesGainedCategory;
  percentile: number; // 1-99 integer
  label: string; // "Better than 78% of 10–15 HCP golfers"
  shortLabel: string; // "78th %ile"
  tier: PercentileTier;
}

/** Abramowitz & Stegun rational approximation for standard normal CDF. */
function normalCDF(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  const sign = x < 0 ? -1 : 1;
  const t = 1 / (1 + p * Math.abs(x) / Math.SQRT2);
  const y =
    1 -
    (((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp((-x * x) / 2));
  return 0.5 * (1 + sign * y);
}

function getTier(percentile: number): PercentileTier {
  if (percentile >= 75) return "top";
  if (percentile >= 55) return "above-average";
  if (percentile >= 45) return "average";
  if (percentile >= 25) return "below-average";
  return "bottom";
}

export function formatOrdinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/**
 * Calculate percentile for a single SG category value.
 * Use this for RoundDetailSnapshot where benchmarkBracket is string | null.
 */
export function calculatePercentile(
  category: StrokesGainedCategory,
  sgValue: number,
  bracketLabel: string,
): PercentileResult {
  const sd = CATEGORY_SD[category];
  const z = sgValue / sd;
  const raw = normalCDF(z) * 100;
  const percentile = Math.max(1, Math.min(99, Math.round(raw)));

  return {
    category,
    percentile,
    label: `Better than ${percentile}% of ${bracketLabel} golfers`,
    shortLabel: `${formatOrdinal(percentile)} %ile`,
    tier: getTier(percentile),
  };
}

/**
 * Calculate percentiles for all non-skipped categories in a StrokesGainedResult.
 * Derives bracketLabel internally from result.benchmarkBracket.
 *
 * NOTE: Spec deviation — spec defined calculatePercentiles(result) only.
 * We keep the explicit calculatePercentile(category, sgValue, bracketLabel)
 * for RoundDetailSnapshot where benchmarkBracket is string | null.
 */
export function calculatePercentiles(
  result: StrokesGainedResult,
): Record<StrokesGainedCategory, PercentileResult | null> {
  const bracketLabel =
    BRACKET_LABELS[result.benchmarkBracket] ?? result.benchmarkBracket;
  const skippedSet = new Set(result.skippedCategories);
  const out = {} as Record<StrokesGainedCategory, PercentileResult | null>;

  for (const cat of CATEGORY_ORDER) {
    out[cat] = skippedSet.has(cat)
      ? null
      : calculatePercentile(cat, result.categories[cat], bracketLabel);
  }
  return out;
}

/**
 * Build a compact percentile summary string for OG images / share cards.
 * e.g. "84th %ile  52nd %ile  91st %ile  67th %ile"
 */
export function buildPercentileRow(result: StrokesGainedResult): string {
  const percentiles = calculatePercentiles(result);
  const skippedSet = new Set(result.skippedCategories);
  return CATEGORY_ORDER
    .filter((key) => !skippedSet.has(key) && percentiles[key])
    .map((key) => percentiles[key]!.shortLabel)
    .join("  ");
}
