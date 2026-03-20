"use client";

import { useEffect, useRef } from "react";
import { Download } from "lucide-react";
import type { RoundDetailSnapshot } from "@/lib/golf/types";
import {
  RoundLayout,
  deriveRoundData,
} from "@/app/(tools)/strokes-gained/_components/round-layout";
import { captureElementAsPng, downloadBlob } from "@/lib/capture";
import { trackEvent } from "@/lib/analytics/client";
import { RecipientCta } from "@/app/(tools)/strokes-gained/_components/recipient-cta";

interface SharedRoundClientProps {
  snapshot: RoundDetailSnapshot;
}

export function SharedRoundClient({ snapshot }: SharedRoundClientProps) {
  const derived = deriveRoundData(snapshot);
  const shareCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    trackEvent("shared_saved_round_viewed", {
      referrer: document.referrer || "direct",
    });
  }, []);

  async function handleDownloadPng() {
    if (!shareCardRef.current) return;
    const blob = await captureElementAsPng(shareCardRef.current);
    const filename = `${snapshot.courseName.replace(/\s+/g, "-").toLowerCase()}-sg-${snapshot.playedAt}.png`;
    downloadBlob(blob, filename);
    trackEvent("saved_round_png_downloaded", {
      round_id: snapshot.roundId,
      surface: "shared_page",
    });
  }

  return (
    <RoundLayout
      snapshot={snapshot}
      derived={derived}
      shareCardRef={shareCardRef}
      actions={
        <div className="text-center">
          <button
            type="button"
            onClick={handleDownloadPng}
            className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 shadow-sm transition-colors hover:bg-neutral-50"
          >
            <Download className="h-4 w-4" />
            Download PNG
          </button>

          <RecipientCta
            senderHandicap={snapshot.handicapIndex}
            senderResult={derived.sgResult}
            surface="token_share"
          />
        </div>
      }
    />
  );
}
