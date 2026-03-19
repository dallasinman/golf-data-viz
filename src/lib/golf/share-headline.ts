/**
 * Emotional headline generation for share cards, OG images, and clipboard text.
 * Pure function — deterministic, no async, no Node APIs.
 */

import type { StrokesGainedResult, StrokesGainedCategory } from "./types";
import { CATEGORY_LABELS, CATEGORY_ORDER, BRACKET_LABELS } from "./constants";
import { truncateText } from "./og-card-data";
import { calculatePercentile } from "./percentile";
import { presentSG } from "./format";

export type HeadlinePattern =
  | "skull"
  | "split"
  | "weapon"
  | "verdict"
  | "shrug"
  | "score-only";

export type HeadlineSentiment = "negative" | "positive" | "neutral";

export interface ShareHeadline {
  /** Share card + OG image (no emoji, max ~70 chars) */
  line: string;
  /** Copy-to-clipboard (with emoji for most patterns) */
  clipboardPrefix: string;
  /** For analytics */
  pattern: HeadlinePattern;
  /** Drives color on OG image + share card */
  sentiment: HeadlineSentiment;
}

/** Hex colors for OG image sentiment rendering. */
export const SENTIMENT_COLORS: Record<HeadlineSentiment, string> = {
  negative: "#fca5a5", // coral — losses
  positive: "#a8d5ba", // light green — gains
  neutral: "#fefcf3", // cream — split, shrug, score-only
};

/** Short abbreviations for compact clipboard/fallback text */
const ABBREV: Record<StrokesGainedCategory, string> = {
  "off-the-tee": "OTT",
  approach: "APP",
  "around-the-green": "ATG",
  putting: "PUTT",
};

/** Format absolute value to 1 decimal */
function fmtAbs(value: number): string {
  return Math.abs(value).toFixed(1);
}

/** Format signed value to 1 decimal with near-zero neutralisation */
function fmtSigned(value: number): string {
  return presentSG(value, 1).formatted;
}

export function generateShareHeadline(
  result: StrokesGainedResult,
  meta: { score: number; courseName: string },
): ShareHeadline {
  const skippedSet = new Set(result.skippedCategories);

  // Only high/medium confidence, non-skipped categories participate
  const active = CATEGORY_ORDER.filter(
    (key) => !skippedSet.has(key) && result.confidence[key] !== "low",
  );

  // Deterministic variant: 0 or 1 — same data = same headline
  const v = Math.abs(Math.round(result.total * 100)) % 2;

  // --- score-only: <= 1 active category ---
  if (active.length <= 1) {
    const line = truncateText(`Shot ${meta.score} at ${meta.courseName}`, 70);
    return {
      line,
      clipboardPrefix: line,
      pattern: "score-only",
      sentiment: "neutral",
    };
  }

  // Find best and worst among active categories
  let best = { key: active[0], value: result.categories[active[0]] };
  let worst = { key: active[0], value: result.categories[active[0]] };
  for (const key of active) {
    const val = result.categories[key];
    if (val > best.value) best = { key, value: val };
    if (val < worst.value) worst = { key, value: val };
  }

  // --- skull: worst <= -2.0 ---
  if (worst.value <= -2.0) {
    const abs = fmtAbs(worst.value);
    const cat = CATEGORY_LABELS[worst.key];
    const line =
      v === 0
        ? `Lost ${abs} strokes ${cat.toLowerCase()}`
        : `${cat} cost me ${abs} strokes`;
    return {
      line,
      clipboardPrefix: `${line} \u{1F480}`,
      pattern: "skull",
      sentiment: "negative",
    };
  }

  // --- split: spread >= 2.5 ---
  const spread = best.value - worst.value;
  if (spread >= 2.5) {
    let line: string;
    if (v === 0) {
      line = `${CATEGORY_LABELS[best.key]}: ${fmtSigned(best.value)}. ${CATEGORY_LABELS[worst.key]}: ${fmtSigned(worst.value)}.`;
      if (line.length > 65) {
        line = `${ABBREV[best.key]}: ${fmtSigned(best.value)}. ${ABBREV[worst.key]}: ${fmtSigned(worst.value)}.`;
      }
    } else {
      line = `My ${CATEGORY_LABELS[best.key].toLowerCase()} is ${fmtAbs(spread)} strokes ahead of my ${CATEGORY_LABELS[worst.key].toLowerCase()}`;
      if (line.length > 65) {
        line = `My ${ABBREV[best.key]} is ${fmtAbs(spread)} strokes ahead of my ${ABBREV[worst.key]}`;
      }
    }
    const clip = `${ABBREV[best.key]} ${fmtSigned(best.value)}, ${ABBREV[worst.key]} ${fmtSigned(worst.value)}`;
    return {
      line,
      clipboardPrefix: clip,
      pattern: "split",
      sentiment: "neutral",
    };
  }

  // --- weapon: best >= +2.0 ---
  if (best.value >= 2.0) {
    const val = fmtAbs(best.value);
    const cat = CATEGORY_LABELS[best.key];
    const catLow = cat.toLowerCase();
    const line =
      v === 0
        ? `Gained ${val} strokes on ${catLow}`
        : `${cat} was ${val} strokes better than peers`;
    return {
      line,
      clipboardPrefix: `Gained ${val} on ${catLow} \u{1F525}`,
      pattern: "weapon",
      sentiment: "positive",
    };
  }

  // --- verdict: |total| >= 1.5 ---
  if (Math.abs(result.total) >= 1.5) {
    const bracket = BRACKET_LABELS[result.benchmarkBracket];
    const abs = fmtAbs(result.total);
    const pos = result.total > 0;
    let line: string;
    if (pos) {
      line =
        v === 0
          ? `Beat my ${bracket} peers by ${abs} strokes`
          : `${abs} strokes better than my ${bracket} peers`;
    } else {
      line =
        v === 0
          ? `Gave back ${abs} strokes to my ${bracket} peers`
          : `${abs} strokes behind my ${bracket} peers`;
    }
    return {
      line,
      clipboardPrefix: `${line} ${pos ? "\u{1F3C6}" : "\u{1F480}"}`,
      pattern: "verdict",
      sentiment: pos ? "positive" : "negative",
    };
  }

  // --- shrug: fallback (percentile-enhanced when a category >= 80th) ---
  const bracketLabel = BRACKET_LABELS[result.benchmarkBracket] ?? result.benchmarkBracket;
  const highPercentile = active
    .filter((key) => result.confidence[key] !== "low")
    .map((key) => ({ key, pct: calculatePercentile(key, result.categories[key], bracketLabel).percentile }))
    .sort((a, b) => b.pct - a.pct)
    .find((e) => e.pct >= 80);

  if (highPercentile) {
    const catLabel = CATEGORY_LABELS[highPercentile.key].toLowerCase();
    const line = `Your ${catLabel} is better than ${highPercentile.pct}% of your peers`;
    return {
      line,
      clipboardPrefix: `${line} \u{1F4AA}`,
      pattern: "shrug",
      sentiment: "positive",
    };
  }

  const pos = result.total > 0;
  const line = pos
    ? v === 0
      ? "Solid across the board"
      : "Solid all around"
    : v === 0
      ? "Dead average across the board"
      : "Right at peer average";
  return {
    line,
    clipboardPrefix: `${line} ${pos ? "\u{1F44C}" : "\u{1F937}"}`,
    pattern: "shrug",
    sentiment: pos ? "positive" : "neutral",
  };
}
