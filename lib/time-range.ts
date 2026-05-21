import { subDays, subMonths, subYears, differenceInDays } from "date-fns";
import type { WorkoutDataset } from "./types";

export type TimeRange = "1w" | "1m" | "1y" | "max";

export type BucketUnit = "day" | "week" | "month";

export const TIME_RANGE_OPTIONS: { value: TimeRange; label: string }[] = [
  { value: "1w", label: "1W" },
  { value: "1m", label: "1M" },
  { value: "1y", label: "1Y" },
  { value: "max", label: "MAX" },
];

export function getRangeBounds(
  dataset: WorkoutDataset,
  range: TimeRange
): { start: Date; end: Date } {
  const end = dataset.dateRange.end;
  let start: Date;

  switch (range) {
    case "1w":
      start = subDays(end, 7);
      break;
    case "1m":
      start = subMonths(end, 1);
      break;
    case "1y":
      start = subYears(end, 1);
      break;
    case "max":
      start = dataset.dateRange.start;
      break;
  }

  if (start < dataset.dateRange.start) {
    start = dataset.dateRange.start;
  }

  return { start, end };
}

export function getBucketUnit(range: TimeRange, start: Date, end: Date): BucketUnit {
  const spanDays = differenceInDays(end, start) + 1;
  if (range === "1w" || range === "1m") return "day";
  if (range === "1y") return "week";
  if (spanDays <= 45) return "day";
  if (spanDays <= 400) return "week";
  return "month";
}

export function timeRangeLabel(range: TimeRange): string {
  switch (range) {
    case "1w":
      return "Last 7 days";
    case "1m":
      return "Last 30 days";
    case "1y":
      return "Last 12 months";
    case "max":
      return "All time";
  }
}
