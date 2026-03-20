import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getRoundByShareToken } from "@/lib/golf/round-queries";
import { findWeakestCategory } from "@/lib/golf/format";
import { derivePresentationTrustFromSnapshot } from "@/lib/golf/presentation-trust";
import { buildRoundMetadataDescription } from "@/lib/golf/round-metadata";
import { SharedRoundClient } from "./_components/shared-round-client";

interface PageProps {
  params: Promise<{ token: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { token } = await params;
  const snapshot = await getRoundByShareToken(token);

  if (!snapshot) {
    return { title: "Round Not Found", robots: { index: false, follow: false } };
  }

  const title = `Shot ${snapshot.score} at ${snapshot.courseName}`;
  const weakest = findWeakestCategory(snapshot);
  const presentationTrust = derivePresentationTrustFromSnapshot(snapshot);
  const description = buildRoundMetadataDescription({
    handicapIndex: snapshot.handicapIndex,
    greensInRegulation: snapshot.greensInRegulation,
    totalPutts: snapshot.totalPutts,
    weakestCategory: weakest,
    presentationTrustMode: presentationTrust?.mode,
  });

  return {
    title,
    description,
    robots: { index: false, follow: false },
    openGraph: {
      title,
      description,
      images: [`/strokes-gained/shared/round/${token}/og`],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`/strokes-gained/shared/round/${token}/og`],
    },
  };
}

export default async function SharedRoundPage({ params }: PageProps) {
  const { token } = await params;
  const snapshot = await getRoundByShareToken(token);

  if (!snapshot) {
    notFound();
  }

  return <SharedRoundClient snapshot={snapshot} />;
}
