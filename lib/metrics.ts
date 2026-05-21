import {
  differenceInWeeks,
  endOfWeek,
  format,
  isWithinInterval,
  startOfWeek,
  subWeeks,
} from "date-fns";
import type { WorkoutDataset, WorkoutSession, WorkoutSet } from "./types";

export function epley1RM(weight: number, reps: number): number {
  if (reps <= 0 || weight <= 0) return 0;
  return weight * (1 + reps / 30);
}

export function formatVolume(kg: number): string {
  if (kg >= 1_000_000) return `${(kg / 1_000_000).toFixed(1)}M`;
  if (kg >= 1000) return `${(kg / 1000).toFixed(1)}k`;
  return Math.round(kg).toLocaleString();
}

export function formatDuration(minutes: number | null): string {
  if (minutes == null) return "—";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function sessionsInRange(
  sessions: WorkoutSession[],
  start: Date,
  end: Date
): WorkoutSession[] {
  return sessions.filter((s) =>
    isWithinInterval(s.date, { start, end })
  );
}

export function totalVolume(sessions: WorkoutSession[]): number {
  return sessions.reduce((sum, s) => sum + s.totalVolume, 0);
}

export function weeklyVolumeSeries(
  dataset: WorkoutDataset,
  weeks = 16
): { week: string; volume: number }[] {
  const end = dataset.dateRange.end;
  const series: { week: string; volume: number }[] = [];

  for (let i = weeks - 1; i >= 0; i--) {
    const weekEnd = endOfWeek(subWeeks(end, i), { weekStartsOn: 1 });
    const weekStart = startOfWeek(subWeeks(end, i), { weekStartsOn: 1 });
    const vol = totalVolume(
      sessionsInRange(dataset.sessions, weekStart, weekEnd)
    );
    series.push({
      week: format(weekStart, "MMM d"),
      volume: vol,
    });
  }

  return series;
}

export function overviewStats(dataset: WorkoutDataset) {
  const now = dataset.dateRange.end;
  const fourWeeksAgo = subWeeks(now, 4);
  const eightWeeksAgo = subWeeks(now, 8);

  const last4 = sessionsInRange(dataset.sessions, fourWeeksAgo, now);
  const prior4 = sessionsInRange(
    dataset.sessions,
    eightWeeksAgo,
    fourWeeksAgo
  );

  const volumeLast4 = totalVolume(last4);
  const volumePrior4 = totalVolume(prior4);
  const volumeChange =
    volumePrior4 > 0
      ? ((volumeLast4 - volumePrior4) / volumePrior4) * 100
      : 0;

  const totalWeeks = Math.max(
    1,
    differenceInWeeks(dataset.dateRange.end, dataset.dateRange.start)
  );
  const workoutsPerWeek = dataset.sessions.length / totalWeeks;

  const exerciseVolume = new Map<string, number>();
  for (const session of last4) {
    for (const set of session.sets) {
      if (set.volume <= 0) continue;
      exerciseVolume.set(
        set.exerciseName,
        (exerciseVolume.get(set.exerciseName) ?? 0) + set.volume
      );
    }
  }
  let topExercise = "—";
  let topVol = 0;
  for (const [name, vol] of exerciseVolume) {
    if (vol > topVol) {
      topVol = vol;
      topExercise = name;
    }
  }

  const avgDuration =
    last4.length > 0
      ? last4.reduce((s, x) => s + (x.durationMinutes ?? 0), 0) / last4.length
      : 0;

  return {
    sessionsLast4Weeks: last4.length,
    volumeLast4Weeks: volumeLast4,
    volumePrior4Weeks: volumePrior4,
    volumeChangePercent: volumeChange,
    workoutsPerWeekAvg: workoutsPerWeek,
    topExercise,
    avgDurationMinutes: avgDuration,
  };
}

export interface PRRecord {
  exercise: string;
  metric: string;
  value: number;
  date: Date;
}

export function detectPRs(dataset: WorkoutDataset, limit = 15): PRRecord[] {
  const maxWeightByExercise = new Map<
    string,
    { value: number; date: Date; reps: number }
  >();
  const maxVolumeSet = new Map<string, { value: number; date: Date }>();

  for (const session of dataset.sessions) {
    for (const set of session.sets) {
      if (set.setType === "warmup") continue;
      if (set.weight <= 0) continue;

      const prev = maxWeightByExercise.get(set.exerciseName);
      if (!prev || set.weight > prev.value) {
        maxWeightByExercise.set(set.exerciseName, {
          value: set.weight,
          date: set.date,
          reps: set.reps,
        });
      }

      if (set.volume > 0) {
        const prevVol = maxVolumeSet.get(set.exerciseName);
        if (!prevVol || set.volume > prevVol.value) {
          maxVolumeSet.set(set.exerciseName, {
            value: set.volume,
            date: set.date,
          });
        }
      }
    }
  }

  const prs: PRRecord[] = [];
  for (const [exercise, data] of maxWeightByExercise) {
    prs.push({
      exercise,
      metric: `Max weight (${data.reps} reps)`,
      value: data.value,
      date: data.date,
    });
  }

  prs.sort((a, b) => b.date.getTime() - a.date.getTime());
  return prs.slice(0, limit);
}

export function exerciseStats(
  dataset: WorkoutDataset,
  exerciseName: string,
  rangeStart?: Date
) {
  const cutoff = rangeStart ?? subWeeks(dataset.dateRange.end, 13);
  const sets: WorkoutSet[] = [];

  for (const session of dataset.sessions) {
    if (session.date < cutoff) continue;
    for (const set of session.sets) {
      if (set.exerciseName !== exerciseName) continue;
      if (set.setType === "warmup") continue;
      sets.push(set);
    }
  }

  let maxWeight = 0;
  let max1RM = 0;

  for (const set of sets) {
    if (set.weight > maxWeight) maxWeight = set.weight;
    const rm = epley1RM(set.weight, set.reps);
    if (rm > max1RM) max1RM = rm;
  }

  return { maxWeight, max1RM, sets };
}

export function topExercisesByVolume(
  dataset: WorkoutDataset,
  weeks = 4,
  limit = 10
): { name: string; volume: number }[] {
  const end = dataset.dateRange.end;
  const start = subWeeks(end, weeks);
  const sessions = sessionsInRange(dataset.sessions, start, end);
  const map = new Map<string, number>();

  for (const session of sessions) {
    for (const set of session.sets) {
      if (set.volume <= 0) continue;
      map.set(
        set.exerciseName,
        (map.get(set.exerciseName) ?? 0) + set.volume
      );
    }
  }

  return [...map.entries()]
    .map(([name, volume]) => ({ name, volume }))
    .sort((a, b) => b.volume - a.volume)
    .slice(0, limit);
}
