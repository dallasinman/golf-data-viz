/**
 * Handicap peer benchmark data and lookup utilities.
 *
 * Sources for benchmark data:
 * - USGA/R&A handicap statistics
 * - Arccos aggregate data (public reports)
 * - Shot Scope performance data (by handicap band)
 * - Lou Stagner's published amateur statistics
 */

import type {
  BenchmarkMeta,
  BracketBenchmark,
  CitationMetricKey,
  ChangelogEntry,
  HandicapBracket,
  MetricCitation,
} from "./types";
import { ALL_HANDICAP_BRACKETS } from "./types";
import rawData from "@/data/benchmarks/handicap-brackets.json";

interface BenchmarkFile {
  version: string;
  updatedAt: string;
  provisional: boolean;
  sources: string[];
  methodology: string;
  sampleSizeByBracket: Record<string, number | null>;
  notes: string[];
  citations: Record<CitationMetricKey, MetricCitation[]>;
  changelog: ChangelogEntry[];
  brackets: BracketBenchmark[];
}

const data = rawData as BenchmarkFile;

/** Load all bracket benchmarks from static JSON. */
export function loadBrackets(): BracketBenchmark[] {
  return data.brackets;
}

/** Get benchmark provenance metadata for trust signals. */
export function getBenchmarkMeta(): BenchmarkMeta {
  return {
    version: data.version,
    updatedAt: data.updatedAt,
    provisional: data.provisional,
    sources: data.sources ?? [],
    citations: data.citations,
    changelog: data.changelog,
  };
}

/** Derive display status from a metric's citation array. */
export function getCitationStatus(
  citations: MetricCitation[]
): "pending" | "partial" | "sourced" {
  const withCoverage = citations.filter((c) => c.coveredBrackets.length > 0);
  if (withCoverage.length === 0) return "pending";

  const covered = new Set(withCoverage.flatMap((c) => c.coveredBrackets));
  const allCovered = ALL_HANDICAP_BRACKETS.every((b) => covered.has(b));
  return allCovered ? "sourced" : "partial";
}

/** Map handicap index to bracket label. */
function handicapToBracketLabel(index: number): HandicapBracket {
  if (!Number.isFinite(index) || index < 0 || index > 54) {
    throw new RangeError(
      `Handicap index must be between 0 and 54, got ${index}`
    );
  }
  if (index < 5) return "0-5";
  if (index < 10) return "5-10";
  if (index < 15) return "10-15";
  if (index < 20) return "15-20";
  if (index < 25) return "20-25";
  if (index < 30) return "25-30";
  return "30+";
}

/** Get the benchmark for a given handicap index (snap-to-nearest bracket). */
export function getBracketForHandicap(index: number): BracketBenchmark {
  const label = handicapToBracketLabel(index);
  const bracket = data.brackets.find((b) => b.bracket === label);
  if (!bracket) {
    throw new Error(`Bracket not found for label: ${label}`);
  }
  return bracket;
}
