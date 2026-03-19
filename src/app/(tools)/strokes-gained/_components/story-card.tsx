"use client";

import { forwardRef } from "react";
import type {
  StrokesGainedResult,
  RadarChartDatum,
  RoundInput,
} from "@/lib/golf/types";
import type { ShareHeadline } from "@/lib/golf/share-headline";
import { BRACKET_LABELS, CATEGORY_LABELS, CATEGORY_ORDER } from "@/lib/golf/constants";
import { formatHandicap, formatCompactDate, buildFamiliarStats, formatScoringBreakdown, presentSG } from "@/lib/golf/format";
import { calculatePercentiles } from "@/lib/golf/percentile";
import { RadarChart } from "@/components/charts/radar-chart";

interface StoryCardProps {
  result: StrokesGainedResult;
  chartData: RadarChartDatum[];
  roundInput: RoundInput;
  headline: ShareHeadline;
}

export const StoryCard = forwardRef<HTMLDivElement, StoryCardProps>(
  function StoryCard({ result, chartData, roundInput, headline }, ref) {
    const bracketLabel =
      BRACKET_LABELS[result.benchmarkBracket] ?? result.benchmarkBracket;
    const skippedSet = new Set(result.skippedCategories);
    const percentiles = calculatePercentiles(result);
    const totalSg = presentSG(result.total);

    const familiarStats = buildFamiliarStats(roundInput);
    const scoringBreakdown = formatScoringBreakdown(roundInput);

    return (
      <div
        ref={ref}
        data-testid="story-card"
        className="w-[1080px] overflow-hidden"
        style={{ fontFamily: "DM Sans, sans-serif" }}
      >
        {/* ═══ Dark green header band ═══ */}
        <div className="bg-brand-900 px-12 pb-6 pt-8">
          <p className="truncate text-lg font-bold text-brand-100"
            style={{ fontFamily: "DM Serif Display, serif" }}
          >
            {roundInput.course}
          </p>
          <p className="mt-1 text-sm text-brand-100/60">
            {formatCompactDate(roundInput.date)} · {formatHandicap(roundInput.handicapIndex)} index · vs {bracketLabel}
          </p>
        </div>

        {/* ═══ Score hero + SG total badge ═══ */}
        <div className="bg-brand-900 px-12 pb-8">
          <div className="flex items-end gap-8">
            <div className="flex flex-col">
              <span
                className="font-bold leading-none text-white"
                style={{ fontFamily: "DM Serif Display, serif", fontSize: "96px" }}
              >
                {roundInput.score}
              </span>
              <span className="mt-1 text-xs uppercase tracking-widest text-brand-100/50">
                Final Score
              </span>
            </div>

            {/* SG Total badge */}
            <div className="mb-3 flex flex-col items-center">
              <div
                className={`flex h-24 w-24 items-center justify-center rounded-full border-3 ${
                  totalSg.tone === "neutral"
                    ? "border-neutral-400 bg-neutral-400/15"
                    : totalSg.tone === "positive"
                      ? "border-data-positive bg-data-positive/15"
                      : "border-data-negative bg-data-negative/15"
                }`}
              >
                <span
                  className={`font-mono text-2xl font-bold ${
                    totalSg.tone === "neutral"
                      ? "text-neutral-300"
                      : totalSg.tone === "positive"
                        ? "text-green-400"
                        : "text-red-300"
                  }`}
                >
                  {totalSg.formatted}
                </span>
              </div>
              <span className="mt-1 text-xs text-brand-100/50">SG Total</span>
            </div>
          </div>

          {/* Bracket context + headline */}
          <div className="mt-3 h-px bg-accent-500/50" />
          <p
            className={`mt-3 text-lg font-medium ${
              headline.sentiment === "negative"
                ? "text-red-300"
                : headline.sentiment === "positive"
                  ? "text-green-400"
                  : "text-cream-50"
            }`}
          >
            {headline.line}
          </p>
        </div>

        {/* ═══ White body ═══ */}
        <div className="bg-white px-12 pb-8 pt-6">
          {/* Radar chart — taller for story format */}
          <div style={{ height: 500 }}>
            <RadarChart data={chartData} bracketLabel={bracketLabel} />
          </div>

          {/* Category rows with percentiles */}
          <div className="mt-6 space-y-2">
            {CATEGORY_ORDER.map((key) => {
              const skipped = skippedSet.has(key);
              const sg = presentSG(result.categories[key]);
              const pct = percentiles[key];

              return (
                <div
                  key={key}
                  className="flex items-center justify-between rounded-lg bg-cream-50 px-5 py-3"
                >
                  {/* Colored left indicator */}
                  {!skipped && (
                    <span
                      className={`mr-4 h-8 w-1.5 rounded-full ${
                        sg.tone === "neutral"
                          ? "bg-neutral-400"
                          : sg.tone === "positive"
                            ? "bg-data-positive"
                            : "bg-data-negative"
                      }`}
                    />
                  )}
                  <span className="flex-1 text-lg font-medium text-neutral-800">
                    {CATEGORY_LABELS[key]}
                  </span>
                  {skipped ? (
                    <span className="text-base italic text-neutral-400">Not Tracked</span>
                  ) : (
                    <span className="flex items-center gap-3">
                      <span
                        className={`font-mono text-xl font-bold ${
                          sg.tone === "neutral"
                            ? "text-neutral-500"
                            : sg.tone === "positive"
                              ? "text-data-positive"
                              : "text-data-negative"
                        }`}
                      >
                        {sg.formatted}
                      </span>
                      {pct && (
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-sm font-medium tabular-nums ${
                            pct.tier === "top"
                              ? "bg-brand-50 text-data-positive"
                              : pct.tier === "bottom"
                                ? "bg-red-50 text-data-negative"
                                : "bg-neutral-100 text-neutral-500"
                          }`}
                        >
                          {pct.shortLabel}
                        </span>
                      )}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Familiar stats + scoring breakdown */}
          {(familiarStats.length > 0 || scoringBreakdown.length > 0) && (
            <div className="mt-6 rounded-lg border border-cream-200 bg-cream-50 px-5 py-3">
              {familiarStats.length > 0 && (
                <p className="text-sm text-neutral-700">
                  {familiarStats.join(" · ")}
                </p>
              )}
              {scoringBreakdown.length > 0 && (
                <p className="mt-1 text-sm text-neutral-500">
                  {scoringBreakdown.join(" · ")}
                </p>
              )}
            </div>
          )}

          {/* Watermark */}
          <div className="mt-8 flex items-center justify-center gap-2.5">
            <svg width="18" height="18" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M16 2C8.268 2 2 8.268 2 16s6.268 14 14 14c5.1 0 9.6-2.73 12.07-6.81" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M16 7C11.029 7 7 11.029 7 16s4.029 9 9 9c3.28 0 6.17-1.76 7.75-4.38" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" opacity="0.7" />
              <circle cx="16" cy="16" r="1.8" fill="currentColor" />
            </svg>
            <p className="text-base text-accent-500">
              golfdataviz.com/strokes-gained
            </p>
          </div>
        </div>
      </div>
    );
  }
);
