"use client";

import { forwardRef } from "react";
import type {
  BenchmarkMeta,
  StrokesGainedCategory,
  StrokesGainedResult,
  RadarChartDatum,
} from "@/lib/golf/types";
import { BRACKET_LABELS } from "@/lib/golf/constants";
import { RadarChart } from "@/components/charts/radar-chart";

const CATEGORY_LABELS: Record<StrokesGainedCategory, string> = {
  "off-the-tee": "Off the Tee",
  approach: "Approach",
  "around-the-green": "Around the Green",
  putting: "Putting",
};

const CATEGORY_ORDER: StrokesGainedCategory[] = [
  "off-the-tee",
  "approach",
  "around-the-green",
  "putting",
];

function formatSG(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}`;
}

interface ShareCardProps {
  result: StrokesGainedResult;
  chartData: RadarChartDatum[];
  courseName: string;
  score: number;
  benchmarkMeta?: BenchmarkMeta;
}

export const ShareCard = forwardRef<HTMLDivElement, ShareCardProps>(
  function ShareCard({ result, chartData, courseName, score, benchmarkMeta }, ref) {
    const bracketLabel =
      BRACKET_LABELS[result.benchmarkBracket] ?? result.benchmarkBracket;

    const skippedSet = new Set(result.skippedCategories);
    const entries = CATEGORY_ORDER.map((key) => ({
      key,
      label: CATEGORY_LABELS[key],
      value: result.categories[key],
      skipped: skippedSet.has(key),
    }));

    return (
      <div
        ref={ref}
        data-testid="share-card"
        className="w-[600px] overflow-hidden rounded-xl shadow-lg"
        style={{ fontFamily: "DM Sans, sans-serif" }}
      >
        {/* Dark green header band */}
        <div
          className="px-8 pb-5 pt-6"
          style={{ backgroundColor: "#0f3d22" }}
        >
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1 pr-4">
              <h2
                className="truncate text-xl font-bold text-white"
                style={{ fontFamily: "DM Serif Display, serif" }}
              >
                {courseName}
              </h2>
              <p className="mt-1 text-sm" style={{ color: "#a8d5ba" }}>
                Shot {score} &middot; vs {bracketLabel}
              </p>
              {benchmarkMeta && (
                <p className="mt-0.5 text-xs italic" style={{ color: "#7cb899" }}>
                  Estimated SG Proxy{benchmarkMeta.provisional ? " (provisional)" : ""} &middot; Benchmarks v{benchmarkMeta.version}
                </p>
              )}
            </div>
            {/* Total SG badge */}
            <div className="flex flex-col items-center">
              <div
                className="flex h-16 w-16 items-center justify-center rounded-full"
                style={{
                  backgroundColor: result.total >= 0 ? "rgba(22, 163, 74, 0.15)" : "rgba(220, 38, 38, 0.15)",
                  border: `2px solid ${result.total >= 0 ? "#16a34a" : "#dc2626"}`,
                }}
              >
                <span
                  className="text-lg font-bold"
                  style={{
                    fontFamily: "JetBrains Mono, monospace",
                    color: result.total >= 0 ? "#4ade80" : "#fca5a5",
                  }}
                >
                  {formatSG(result.total)}
                </span>
              </div>
              <p className="mt-1 text-xs" style={{ color: "#7cb899" }}>Total SG</p>
            </div>
          </div>
          {/* Gold separator */}
          <div className="mt-4 h-px" style={{ backgroundColor: "#b8860b", opacity: 0.5 }} />
        </div>

        {/* White body */}
        <div className="bg-white px-8 py-5">
          {/* Radar chart */}
          <div style={{ height: 300 }}>
            <RadarChart data={chartData} bracketLabel={bracketLabel} />
          </div>

          {/* Category rows */}
          <div className="mt-4 space-y-1.5">
            {entries.map(({ key, label, value, skipped }, i) => (
              <div
                key={key}
                className="flex items-center justify-between overflow-hidden rounded-md"
                style={{ backgroundColor: i % 2 === 0 ? "#ffffff" : "#fefcf3" }}
              >
                {/* Colored left bar */}
                {!skipped && (
                  <span
                    className="w-1 self-stretch"
                    style={{ backgroundColor: value >= 0 ? "#16a34a" : "#dc2626" }}
                  />
                )}
                <span
                  className="flex-1 px-4 py-2 text-sm font-medium"
                  style={{ color: "#292524", fontFamily: "DM Sans, sans-serif" }}
                >
                  {label}
                </span>
                {skipped ? (
                  <span className="px-4 py-2 text-sm italic" style={{ color: "#a8a29e" }}>
                    Not Tracked
                  </span>
                ) : (
                  <span
                    className="px-4 py-2 text-sm font-semibold"
                    style={{
                      fontFamily: "JetBrains Mono, monospace",
                      color: value >= 0 ? "#16a34a" : "#dc2626",
                    }}
                  >
                    {formatSG(value)}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Watermark */}
          <div className="mt-5 flex items-center justify-center gap-2">
            {/* Mini contour mark */}
            <svg width="14" height="14" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M16 2C8.268 2 2 8.268 2 16s6.268 14 14 14c5.1 0 9.6-2.73 12.07-6.81" stroke="#b8860b" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M16 7C11.029 7 7 11.029 7 16s4.029 9 9 9c3.28 0 6.17-1.76 7.75-4.38" stroke="#b8860b" strokeWidth="1.8" strokeLinecap="round" opacity="0.7" />
              <circle cx="16" cy="16" r="1.8" fill="#b8860b" />
            </svg>
            <p className="text-xs" style={{ color: "#b8860b" }}>
              Golf Data Viz &middot; golfdataviz.com
            </p>
          </div>
        </div>
      </div>
    );
  }
);
