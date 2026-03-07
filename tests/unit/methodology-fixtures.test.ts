import { describe, it, expect } from "vitest";
import { CALIBRATION_FIXTURES } from "@/app/methodology/page";
import { calculateStrokesGainedV3 } from "@/lib/golf/strokes-gained-v3";
import { getInterpolatedBenchmark } from "@/lib/golf/benchmarks";

/**
 * Tolerance for "near peer average" fixtures (±1.0 strokes).
 *
 * Proxy SG is inherently imprecise — category calibration, reconciliation,
 * and the ATG-fallback path all introduce variance. ±1.0 is conservative
 * enough to catch gross directional errors (e.g., +1.50 for a "near zero"
 * fixture) while allowing for normal proxy imprecision.
 */
const NEAR_ZERO_TOLERANCE = 1.0;

/**
 * Maps the declared expectation string from each fixture to an assertion rule.
 * This protects the page contract: if the fixture's expected label says
 * "Positive", the computed SG total must actually be positive.
 */
function assertDirection(total: number, expected: string, label: string) {
  if (expected.toLowerCase().includes("positive")) {
    expect(total, `${label}: expected positive, got ${total.toFixed(2)}`).toBeGreaterThan(0);
  } else if (expected.toLowerCase().includes("negative")) {
    expect(total, `${label}: expected negative, got ${total.toFixed(2)}`).toBeLessThan(0);
  } else if (expected.includes("~0")) {
    expect(
      Math.abs(total),
      `${label}: expected near zero (±${NEAR_ZERO_TOLERANCE}), got ${total.toFixed(2)}`
    ).toBeLessThanOrEqual(NEAR_ZERO_TOLERANCE);
  } else {
    throw new Error(`Unknown expected direction: "${expected}" for fixture "${label}"`);
  }
}

describe("Methodology page fixture directions", () => {
  it.each(CALIBRATION_FIXTURES)(
    "$label: SG direction matches declared expectation",
    (fixture) => {
      const benchmark = getInterpolatedBenchmark(fixture.input.handicapIndex);
      const result = calculateStrokesGainedV3(fixture.input, benchmark);
      assertDirection(result.total, fixture.expected, fixture.label);
    },
  );
});
