import {
  addDays,
  addMonths,
  addWeeks,
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  isWithinInterval,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import type { WorkoutDataset, WorkoutSession } from "./types";
import { epley1RM, sessionsInRange, totalVolume } from "./metrics";
import {
  getBucketUnit,
  getRangeBounds,
  type BucketUnit,
  type TimeRange,
} from "./time-range";

export interface ChartPoint {
  /** Stable key for chart axis / range selection */
  id: string;
  label: string;
  date: string;
  value: number;
  periodStart?: string;
  periodEnd?: string;
}

export interface ExerciseChartPoint {
  id: string;
  label: string;
  date: string;
  periodStart?: string;
  periodEnd?: string;
  maxWeight: number;
  volume: number;
  est1RM: number;
}

function generateBuckets(
  start: Date,
  end: Date,
  unit: BucketUnit
): { start: Date; end: Date; label: string }[] {
  const buckets: { start: Date; end: Date; label: string }[] = [];
  let cursor =
    unit === "day"
      ? startOfDay(start)
      : unit === "week"
        ? startOfWeek(start, { weekStartsOn: 1 })
        : startOfMonth(start);

  while (cursor <= end) {
    const bucketEnd =
      unit === "day"
        ? endOfDay(cursor)
        : unit === "week"
          ? endOfWeek(cursor, { weekStartsOn: 1 })
          : endOfMonth(cursor);

    const label =
      unit === "day"
        ? format(cursor, "MMM d")
        : unit === "week"
          ? format(cursor, "MMM d")
          : format(cursor, "MMM yy");

    buckets.push({ start: cursor, end: bucketEnd, label });

    cursor =
      unit === "day"
        ? addDays(cursor, 1)
        : unit === "week"
          ? addWeeks(cursor, 1)
          : addMonths(cursor, 1);
  }

  return buckets;
}

function sessionsInBucket(
  sessions: WorkoutSession[],
  bucketStart: Date,
  bucketEnd: Date
): WorkoutSession[] {
  return sessions.filter((s) =>
    isWithinInterval(s.date, { start: bucketStart, end: bucketEnd })
  );
}

function filteredSessions(
  dataset: WorkoutDataset,
  range: TimeRange
): WorkoutSession[] {
  const { start, end } = getRangeBounds(dataset, range);
  return sessionsInRange(dataset.sessions, start, end);
}

export function volumeTimeSeries(
  dataset: WorkoutDataset,
  range: TimeRange
): ChartPoint[] {
  const { start, end } = getRangeBounds(dataset, range);
  const unit = getBucketUnit(range, start, end);
  const sessions = filteredSessions(dataset, range);

  return generateBuckets(start, end, unit).map((bucket) => ({
    id: bucket.start.toISOString(),
    label: bucket.label,
    date: bucket.label,
    periodStart: bucket.start.toISOString(),
    periodEnd: bucket.end.toISOString(),
    value: totalVolume(sessionsInBucket(sessions, bucket.start, bucket.end)),
  }));
}

export function sessionCountSeries(
  dataset: WorkoutDataset,
  range: TimeRange
): ChartPoint[] {
  const { start, end } = getRangeBounds(dataset, range);
  const unit = getBucketUnit(range, start, end);
  const sessions = filteredSessions(dataset, range);

  return generateBuckets(start, end, unit).map((bucket) => ({
    id: bucket.start.toISOString(),
    label: bucket.label,
    date: bucket.label,
    periodStart: bucket.start.toISOString(),
    periodEnd: bucket.end.toISOString(),
    value: sessionsInBucket(sessions, bucket.start, bucket.end).length,
  }));
}

export function durationTimeSeries(
  dataset: WorkoutDataset,
  range: TimeRange
): ChartPoint[] {
  const { start, end } = getRangeBounds(dataset, range);
  const unit = getBucketUnit(range, start, end);
  const sessions = filteredSessions(dataset, range);

  return generateBuckets(start, end, unit).map((bucket) => {
    const inBucket = sessionsInBucket(sessions, bucket.start, bucket.end);
    const withDuration = inBucket.filter((s) => s.durationMinutes != null);
    const avg =
      withDuration.length > 0
        ? withDuration.reduce((sum, s) => sum + (s.durationMinutes ?? 0), 0) /
          withDuration.length
        : 0;
    return {
      id: bucket.start.toISOString(),
      label: bucket.label,
      date: bucket.label,
      periodStart: bucket.start.toISOString(),
      periodEnd: bucket.end.toISOString(),
      value: Math.round(avg),
    };
  });
}

export function exerciseProgressSeries(
  dataset: WorkoutDataset,
  exerciseName: string,
  range: TimeRange
): ExerciseChartPoint[] {
  const sessions = filteredSessions(dataset, range);
  const points: ExerciseChartPoint[] = [];

  for (const session of sessions) {
    const exerciseSets = session.sets.filter(
      (s) => s.exerciseName === exerciseName && s.setType !== "warmup"
    );
    if (exerciseSets.length === 0) continue;

    let maxWeight = 0;
    let volume = 0;
    let est1RM = 0;

    for (const set of exerciseSets) {
      if (set.weight > maxWeight) maxWeight = set.weight;
      volume += set.volume;
      const rm = epley1RM(set.weight, set.reps);
      if (rm > est1RM) est1RM = rm;
    }

    points.push({
      id: session.date.toISOString(),
      label: format(session.date, "MMM d"),
      date: format(session.date, "MMM d, yyyy"),
      periodStart: session.date.toISOString(),
      periodEnd: session.date.toISOString(),
      maxWeight,
      volume,
      est1RM: Math.round(est1RM * 10) / 10,
    });
  }

  return points.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
}

export function topExercisesBarSeries(
  dataset: WorkoutDataset,
  range: TimeRange,
  limit = 8
): ChartPoint[] {
  const sessions = filteredSessions(dataset, range);
  const map = new Map<string, number>();

  for (const session of sessions) {
    for (const set of session.sets) {
      if (set.volume <= 0) continue;
      map.set(set.exerciseName, (map.get(set.exerciseName) ?? 0) + set.volume);
    }
  }

  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, value]) => ({
      id: name,
      label: name.length > 18 ? name.slice(0, 16) + "…" : name,
      date: name,
      value,
    }));
}

export function rangeSummaryStats(
  dataset: WorkoutDataset,
  range: TimeRange
) {
  const sessions = filteredSessions(dataset, range);
  const vol = totalVolume(sessions);
  const withDuration = sessions.filter((s) => s.durationMinutes != null);
  const avgDuration =
    withDuration.length > 0
      ? withDuration.reduce((s, x) => s + (x.durationMinutes ?? 0), 0) /
        withDuration.length
      : 0;

  return {
    sessionCount: sessions.length,
    totalVolume: vol,
    avgDurationMinutes: avgDuration,
  };
}
