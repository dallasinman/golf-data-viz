"use client";

import { useState, useRef } from "react";
import type {
  RoundInput,
  StrokesGainedResult,
  RadarChartDatum,
} from "@/lib/golf/types";
import { getBracketForHandicap } from "@/lib/golf/benchmarks";
import {
  calculateStrokesGained,
  toRadarChartData,
} from "@/lib/golf/strokes-gained";
import { RoundInputForm } from "./_components/round-input-form";
import { ResultsSummary } from "./_components/results-summary";
import { RadarChart } from "@/components/charts/radar-chart";
import { saveRound } from "./actions";

export default function StrokesGainedPage() {
  const [result, setResult] = useState<StrokesGainedResult | null>(null);
  const [chartData, setChartData] = useState<RadarChartDatum[] | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  function handleFormSubmit(input: RoundInput) {
    const benchmark = getBracketForHandicap(input.handicapIndex);
    const sgResult = calculateStrokesGained(input, benchmark);
    const radar = toRadarChartData(sgResult);

    setResult(sgResult);
    setChartData(radar);
    setSaveError(null);

    // Save to DB in background — surface errors to user
    saveRound(input, sgResult)
      .then((res) => {
        if (!res.success) {
          console.error("[StrokesGained] Save failed:", res.error);
          setSaveError("Round could not be saved. Your results are still shown below.");
        }
      })
      .catch((err) => {
        console.error("[StrokesGained] Save transport error:", err);
        setSaveError("Round could not be saved. Your results are still shown below.");
      });

    // Smooth scroll to results
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900">
        Strokes Gained Benchmarker
      </h1>
      <p className="mt-2 text-gray-600">
        See where you gain and lose strokes vs your handicap peers.
      </p>

      <div className="mt-8">
        <RoundInputForm onSubmit={handleFormSubmit} />
      </div>

      {saveError && (
        <div
          data-testid="save-error"
          role="alert"
          className="mt-6 flex items-center justify-between rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
        >
          <span>{saveError}</span>
          <button
            type="button"
            onClick={() => setSaveError(null)}
            className="ml-4 font-medium text-amber-600 hover:text-amber-800"
          >
            Dismiss
          </button>
        </div>
      )}

      {result && chartData && (
        <div ref={resultsRef} data-testid="sg-results" className="mt-12 space-y-8">
          <h2 className="text-2xl font-bold text-gray-900">
            Your Strokes Gained Breakdown
          </h2>
          <div style={{ height: 400 }}>
            <RadarChart data={chartData} />
          </div>
          <ResultsSummary result={result} />
        </div>
      )}
    </main>
  );
}
