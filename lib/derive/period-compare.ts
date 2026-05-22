import {
  endOfMonth,
  endOfQuarter,
  endOfWeek,
  endOfYear,
  startOfMonth,
  startOfQuarter,
  startOfWeek,
  startOfYear,
  subMonths,
  subQuarters,
  subWeeks,
  subYears,
} from "date-fns";
import { sessionsInRange, totalVolume } from "@/lib/metrics";
import type { WorkoutDataset, WorkoutSession } from "@/lib/types";

export type ComparePeriod = "week" | "month" | "quarter" | "year";

export interface PeriodBucket {
  start: Date;
  end: Date;
  sessions: WorkoutSession[];
  sessionCount: number;
  totalVolume: number;
  totalSets: number;
  avgDurationMinutes: number;
}

export interface PeriodCompare {
  period: ComparePeriod;
  current: PeriodBucket;
  previous: PeriodBucket;
  delta: {
    sessions: number;
    sessionsPercent: number;
    volume: number;
    volumePercent: number;
    sets: number;
    setsPercent: number;
    duration: number;
    durationPercent: number;
  };
}

function bounds(reference: Date, period: ComparePeriod, weekStartsOn: 0 | 1) {
  switch (period) {
    case "week":
      return {
        currentStart: startOfWeek(reference, { weekStartsOn }),
        currentEnd: endOfWeek(reference, { weekStartsOn }),
        previousStart: startOfWeek(subWeeks(reference, 1), { weekStartsOn }),
        previousEnd: endOfWeek(subWeeks(reference, 1), { weekStartsOn }),
      };
    case "month":
      return {
        currentStart: startOfMonth(reference),
        currentEnd: endOfMonth(reference),
        previousStart: startOfMonth(subMonths(reference, 1)),
        previousEnd: endOfMonth(subMonths(reference, 1)),
      };
    case "quarter":
      return {
        currentStart: startOfQuarter(reference),
        currentEnd: endOfQuarter(reference),
        previousStart: startOfQuarter(subQuarters(reference, 1)),
        previousEnd: endOfQuarter(subQuarters(reference, 1)),
      };
    case "year":
      return {
        currentStart: startOfYear(reference),
        currentEnd: endOfYear(reference),
        previousStart: startOfYear(subYears(reference, 1)),
        previousEnd: endOfYear(subYears(reference, 1)),
      };
  }
}

function bucket(
  dataset: WorkoutDataset,
  start: Date,
  end: Date
): PeriodBucket {
  const sessions = sessionsInRange(dataset.sessions, start, end);
  const volume = totalVolume(sessions);
  const sets = sessions.reduce((sum, s) => sum + s.sets.length, 0);
  const durations = sessions
    .map((s) => s.durationMinutes ?? 0)
    .filter((d) => d > 0);
  const avg =
    durations.length > 0
      ? durations.reduce((a, b) => a + b, 0) / durations.length
      : 0;
  return {
    start,
    end,
    sessions,
    sessionCount: sessions.length,
    totalVolume: volume,
    totalSets: sets,
    avgDurationMinutes: avg,
  };
}

function pct(current: number, previous: number): number {
  if (previous === 0) return current === 0 ? 0 : 100;
  return ((current - previous) / previous) * 100;
}

export function periodCompare(
  dataset: WorkoutDataset,
  period: ComparePeriod,
  opts: { weekStartsOn?: 0 | 1 } = {},
): PeriodCompare {
  const weekStartsOn = opts.weekStartsOn ?? 1;
  const ref = dataset.dateRange.end;
  const b = bounds(ref, period, weekStartsOn);
  const current = bucket(dataset, b.currentStart, b.currentEnd);
  const previous = bucket(dataset, b.previousStart, b.previousEnd);

  return {
    period,
    current,
    previous,
    delta: {
      sessions: current.sessionCount - previous.sessionCount,
      sessionsPercent: pct(current.sessionCount, previous.sessionCount),
      volume: current.totalVolume - previous.totalVolume,
      volumePercent: pct(current.totalVolume, previous.totalVolume),
      sets: current.totalSets - previous.totalSets,
      setsPercent: pct(current.totalSets, previous.totalSets),
      duration: current.avgDurationMinutes - previous.avgDurationMinutes,
      durationPercent: pct(
        current.avgDurationMinutes,
        previous.avgDurationMinutes
      ),
    },
  };
}

export function comparePeriodLabel(period: ComparePeriod): {
  current: string;
  previous: string;
} {
  switch (period) {
    case "week":
      return { current: "this week", previous: "last week" };
    case "month":
      return { current: "this month", previous: "last month" };
    case "quarter":
      return { current: "this quarter", previous: "last quarter" };
    case "year":
      return { current: "this year", previous: "last year" };
  }
}
