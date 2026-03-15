// All round_save_failed tests moved to tests/unit/post-results-save-cta.test.tsx.
// The save flow (Turnstile verification, saveRound call, error classification) now
// lives in PostResultsSaveCta, not StrokesGainedClient.

import { describe, it } from "vitest";

describe("round_save_failed (moved)", () => {
  it("tests moved to post-results-save-cta.test.tsx", () => {
    // intentionally empty — original tests are obsolete after save flow extraction
  });
});
