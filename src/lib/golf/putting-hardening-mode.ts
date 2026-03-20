export type PublicPuttingHardeningMode = "off" | "full";
export type ServerPuttingHardeningMode = "off" | "full";

/** Putting hardening is always active — no feature flag. */
export function getPublicPuttingHardeningMode(): PublicPuttingHardeningMode {
  return "full";
}

/** Putting hardening is always active — no feature flag. */
export function getServerPuttingHardeningMode(): ServerPuttingHardeningMode {
  return "full";
}
