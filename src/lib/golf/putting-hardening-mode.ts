export type PublicPuttingHardeningMode = "off" | "full";
export type ServerPuttingHardeningMode = "off" | "shadow" | "full";

export function getPublicPuttingHardeningMode(): PublicPuttingHardeningMode {
  return process.env.NEXT_PUBLIC_SG_PUTTING_HARDENING_MODE === "full"
    ? "full"
    : "off";
}

export function getServerPuttingHardeningMode(): ServerPuttingHardeningMode {
  const mode = process.env.SG_PUTTING_HARDENING_MODE;
  if (mode === "shadow" || mode === "full" || mode === "off") {
    return mode;
  }
  return "off";
}
