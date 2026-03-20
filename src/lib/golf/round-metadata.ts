import { formatHandicap } from "./format";
import type { PresentationTrustMode } from "./types";

interface RoundMetadataDescriptionInput {
  handicapIndex: number;
  greensInRegulation?: number | null;
  totalPutts?: number | null;
  weakestCategory?: string | null;
  presentationTrustMode?: PresentationTrustMode | null;
}

export function buildRoundMetadataDescription({
  handicapIndex,
  greensInRegulation,
  totalPutts,
  weakestCategory,
  presentationTrustMode,
}: RoundMetadataDescriptionInput): string {
  const parts: string[] = [formatHandicap(handicapIndex) + " index"];
  if (greensInRegulation != null) parts.push(`${greensInRegulation} GIR`);
  if (totalPutts != null) parts.push(`${totalPutts} putts`);

  if (presentationTrustMode === "assertive" || presentationTrustMode == null) {
    if (weakestCategory) {
      parts.push(`Lost most strokes on ${weakestCategory}`);
    }
  } else {
    parts.push("Scorecard-based estimate");
  }

  return parts.join(" · ");
}
