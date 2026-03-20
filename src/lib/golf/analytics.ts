import type { PresentationTrust, RoundInput, StrokesGainedResult } from "./types";
import { derivePresentationTrust } from "./presentation-trust";
import { getPublicPuttingHardeningMode } from "./putting-hardening-mode";

export function buildRoundAnalyticsContext(
  input: RoundInput,
  result: StrokesGainedResult,
  presentationTrust?: PresentationTrust | null
) {
  const trust = presentationTrust ?? derivePresentationTrust({ input, result });

  return {
    presentation_variant: trust.mode,
    putting_hardening_version: getPublicPuttingHardeningMode(),
    has_three_putt_input: input.threePutts != null,
    has_one_putt_input: input.onePutts != null,
    promotable_category_count: trust.promotableCategories.length,
  };
}

export function buildLessonReportAnalyticsContext(trustedRoundCount: number) {
  return {
    trusted_round_count: trustedRoundCount,
  };
}
