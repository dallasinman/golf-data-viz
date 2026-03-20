import type { Metadata } from "next";
import { decodeRound } from "@/lib/golf/share-codec";
import { getInterpolatedBenchmark } from "@/lib/golf/benchmarks";
import { calculateStrokesGained } from "@/lib/golf/strokes-gained";
import { findWeakestCategory } from "@/lib/golf/format";
import { derivePresentationTrust } from "@/lib/golf/presentation-trust";
import { buildRoundMetadataDescription } from "@/lib/golf/round-metadata";
import { getRoundSaveAvailability } from "@/lib/round-save";
import { getSampleResult } from "@/lib/golf/sample-round";
import StrokesGainedClient from "./_components/strokes-gained-client";

const PAGE_DESCRIPTION =
  "Free post-round strokes gained analysis from your scorecard stats. Compare yourself to handicap peers, not Tour pros.";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({
  searchParams,
}: PageProps): Promise<Metadata> {
  const params = await searchParams;
  const payload = typeof params.d === "string" ? params.d : undefined;
  const input = payload ? decodeRound(payload) : null;

  if (!input) {
    return {
      title: "Strokes Gained Benchmarker",
      description: PAGE_DESCRIPTION,
      alternates: { canonical: "/strokes-gained" },
      openGraph: {
        title: "Strokes Gained Benchmarker",
        description: PAGE_DESCRIPTION,
        url: "/strokes-gained",
      },
      twitter: {
        card: "summary_large_image",
        title: "Strokes Gained Benchmarker",
        description: PAGE_DESCRIPTION,
      },
    };
  }

  const benchmark = getInterpolatedBenchmark(input.handicapIndex);
  const result = calculateStrokesGained(input, benchmark);

  const title = `Shot ${input.score} at ${input.course}`;
  const weakest = findWeakestCategory({
    sgOffTheTee: result.categories["off-the-tee"],
    sgApproach: result.categories["approach"],
    sgAroundTheGreen: result.categories["around-the-green"],
    sgPutting: result.categories["putting"],
  });
  const presentationTrust = derivePresentationTrust({ input, result });
  const description = buildRoundMetadataDescription({
    handicapIndex: input.handicapIndex,
    greensInRegulation: input.greensInRegulation,
    totalPutts: input.totalPutts,
    weakestCategory: weakest,
    presentationTrustMode: presentationTrust?.mode,
  });

  return {
    title,
    description,
    alternates: {
      canonical: "/strokes-gained",
    },
    robots: {
      index: false,
      follow: false,
    },
    openGraph: {
      title,
      description,
      images: [`/strokes-gained/og?d=${payload}`],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`/strokes-gained/og?d=${payload}`],
    },
  };
}

export default async function StrokesGainedPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const payload = typeof params.d === "string" ? params.d : undefined;
  const from = params.from === "history" ? ("history" as const) : undefined;
  const initialInput = payload ? decodeRound(payload) : null;
  const saveEnabled = getRoundSaveAvailability().enabled;
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? null;

  const sample = getSampleResult();

  return (
    <StrokesGainedClient
      initialInput={initialInput}
      saveEnabled={saveEnabled}
      turnstileSiteKey={turnstileSiteKey}
      samplePreview={sample.preview}
      sampleInput={sample.input}
      from={from}
    />
  );
}
