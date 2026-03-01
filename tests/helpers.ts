import {
  CITATION_METRIC_KEYS,
  type CitationMetricKey,
  type MetricCitation,
} from "@/lib/golf/types";

/** Create an empty citations object with all metric keys initialized to []. */
export function makeEmptyCitations(): Record<
  CitationMetricKey,
  MetricCitation[]
> {
  return Object.fromEntries(
    CITATION_METRIC_KEYS.map((key) => [key, [] as MetricCitation[]])
  ) as unknown as Record<CitationMetricKey, MetricCitation[]>;
}
