// Tool definitions + server-side implementations for the AI coach.
// The client sends a serialized `WorkoutDataset` (Dates → ISO strings); we
// rehydrate it once and run tools against the in-memory dataset.

import type Anthropic from "@anthropic-ai/sdk";
import { format, subWeeks } from "date-fns";
import type {
  WorkoutDataset,
  WorkoutSession,
  WorkoutSet,
} from "@/lib/types";
import {
  detectPRs,
  epley1RM,
  overviewStats,
  sessionsInRange,
  topExercisesByVolume,
  totalVolume,
} from "@/lib/metrics";
import {
  BUCKETS,
  GROUP_TO_BUCKET,
  lookupMuscles,
  type Bucket,
} from "@/lib/derive/muscle-mapping";
import { computeMuscleBalance } from "@/lib/derive/muscle-balance";

// ── Serialization helpers ────────────────────────────────────────────────

export interface SerializedWorkoutSet
  extends Omit<WorkoutSet, "date"> {
  date: string;
}

export interface SerializedWorkoutSession
  extends Omit<WorkoutSession, "date" | "sets"> {
  date: string;
  sets: SerializedWorkoutSet[];
}

export interface SerializedWorkoutDataset
  extends Omit<WorkoutDataset, "sessions" | "dateRange"> {
  sessions: SerializedWorkoutSession[];
  dateRange: { start: string; end: string };
}

export function rehydrateDataset(
  s: SerializedWorkoutDataset,
): WorkoutDataset {
  return {
    importedAt: s.importedAt,
    fileName: s.fileName,
    exercises: s.exercises,
    dateRange: {
      start: new Date(s.dateRange.start),
      end: new Date(s.dateRange.end),
    },
    sessions: s.sessions.map((sess) => ({
      ...sess,
      date: new Date(sess.date),
      sets: sess.sets.map((set) => ({ ...set, date: new Date(set.date) })),
    })),
  };
}

export function serializeDataset(d: WorkoutDataset): SerializedWorkoutDataset {
  return {
    importedAt: d.importedAt,
    fileName: d.fileName,
    exercises: d.exercises,
    dateRange: {
      start: d.dateRange.start.toISOString(),
      end: d.dateRange.end.toISOString(),
    },
    sessions: d.sessions.map((s) => ({
      ...s,
      date: s.date.toISOString(),
      sets: s.sets.map((set) => ({ ...set, date: set.date.toISOString() })),
    })),
  };
}

// ── Tool definitions ─────────────────────────────────────────────────────

export const TOOL_DEFINITIONS: Anthropic.Tool[] = [
  {
    name: "get_overview_stats",
    description:
      "Recent training overview: sessions in last 4 weeks, volume vs prior 4 weeks, workouts-per-week average, training-window dates.",
    input_schema: {
      type: "object" as const,
      properties: {},
    },
  },
  {
    name: "get_top_exercises",
    description:
      "Top exercises ranked by total volume in a recent window. Use this to see what the user has been training most.",
    input_schema: {
      type: "object" as const,
      properties: {
        weeks: {
          type: "number",
          description: "How many weeks back to include (default 4).",
        },
        limit: {
          type: "number",
          description: "Max number of exercises to return (default 8, max 20).",
        },
      },
    },
  },
  {
    name: "get_exercise_history",
    description:
      "Detailed per-session history for one exercise: max weight, top set, total volume, and estimated 1RM over time. Use whenever the user asks about a specific lift.",
    input_schema: {
      type: "object" as const,
      properties: {
        name: {
          type: "string",
          description:
            "Exact exercise name. Use search_exercise first if the user's phrasing is fuzzy.",
        },
        weeks: {
          type: "number",
          description:
            "How many weeks of history to include. Defaults to 16. Use 52+ for long-term progression questions.",
        },
      },
      required: ["name"],
    },
  },
  {
    name: "get_recent_sessions",
    description:
      "List the most recent N workout sessions with per-session volume, set count, and exercises trained.",
    input_schema: {
      type: "object" as const,
      properties: {
        limit: {
          type: "number",
          description: "How many recent sessions to return (default 5, max 20).",
        },
      },
    },
  },
  {
    name: "get_prs",
    description: "Recent personal records (max weight per exercise).",
    input_schema: {
      type: "object" as const,
      properties: {
        limit: {
          type: "number",
          description: "Max PRs to return (default 10).",
        },
      },
    },
  },
  {
    name: "get_body_measurements",
    description:
      "User-logged bodyweight, body fat %, and circumference measurements over time. May be empty if the user hasn't logged any.",
    input_schema: {
      type: "object" as const,
      properties: {
        weeks: {
          type: "number",
          description: "How many weeks back to include (default 26).",
        },
      },
    },
  },
  {
    name: "get_muscle_group_breakdown",
    description:
      "Volume distribution across high-level muscle buckets (push/pull/legs/core/arms) over a window. Use for balance questions.",
    input_schema: {
      type: "object" as const,
      properties: {
        weeks: {
          type: "number",
          description: "How many weeks back to include (default 8).",
        },
      },
    },
  },
  {
    name: "search_exercise",
    description:
      "Fuzzy-find exercise names in the dataset matching a query string. Use when the user's phrasing may not match the exact name.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: {
          type: "string",
          description: "Substring or rough name to match.",
        },
      },
      required: ["query"],
    },
  },
];

// ── Tool input shape ─────────────────────────────────────────────────────

export interface ToolContext {
  dataset: WorkoutDataset;
  bodyMeasurements: BodyMeasurement[];
}

export interface BodyMeasurement {
  date: number;
  weightKg: number | null;
  bodyFatPct: number | null;
  measurements: Record<string, number>;
}

// ── Tool runner ──────────────────────────────────────────────────────────

export function runTool(
  name: string,
  input: unknown,
  ctx: ToolContext,
): unknown {
  const args = (input ?? {}) as Record<string, unknown>;
  switch (name) {
    case "get_overview_stats":
      return toolOverview(ctx.dataset);
    case "get_top_exercises":
      return toolTopExercises(
        ctx.dataset,
        toNum(args.weeks, 4),
        Math.min(toNum(args.limit, 8), 20),
      );
    case "get_exercise_history":
      return toolExerciseHistory(
        ctx.dataset,
        toStr(args.name),
        toNum(args.weeks, 16),
      );
    case "get_recent_sessions":
      return toolRecentSessions(
        ctx.dataset,
        Math.min(toNum(args.limit, 5), 20),
      );
    case "get_prs":
      return toolPRs(ctx.dataset, Math.min(toNum(args.limit, 10), 25));
    case "get_body_measurements":
      return toolBodyMeasurements(
        ctx.bodyMeasurements,
        toNum(args.weeks, 26),
      );
    case "get_muscle_group_breakdown":
      return toolMuscleBreakdown(ctx.dataset, toNum(args.weeks, 8));
    case "search_exercise":
      return toolSearchExercise(ctx.dataset, toStr(args.query));
    default:
      return { error: `Unknown tool: ${name}` };
  }
}

function toNum(v: unknown, fallback: number): number {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function toStr(v: unknown): string {
  return typeof v === "string" ? v : "";
}

// ── Implementations ──────────────────────────────────────────────────────

function toolOverview(dataset: WorkoutDataset) {
  const stats = overviewStats(dataset);
  return {
    dateRange: {
      start: format(dataset.dateRange.start, "yyyy-MM-dd"),
      end: format(dataset.dateRange.end, "yyyy-MM-dd"),
    },
    totalSessions: dataset.sessions.length,
    sessionsLast4Weeks: stats.sessionsLast4Weeks,
    volumeLast4WeeksKg: Math.round(stats.volumeLast4Weeks),
    volumePrior4WeeksKg: Math.round(stats.volumePrior4Weeks),
    volumeChangePercent: Math.round(stats.volumeChangePercent * 10) / 10,
    workoutsPerWeekAvg: Math.round(stats.workoutsPerWeekAvg * 100) / 100,
    avgSessionDurationMin: Math.round(stats.avgDurationMinutes),
    topExerciseLast4Weeks: stats.topExercise,
  };
}

function toolTopExercises(
  dataset: WorkoutDataset,
  weeks: number,
  limit: number,
) {
  const rows = topExercisesByVolume(dataset, weeks, limit);
  return {
    windowWeeks: weeks,
    items: rows.map((r) => ({
      name: r.name,
      volumeKg: Math.round(r.volume),
    })),
  };
}

function toolExerciseHistory(
  dataset: WorkoutDataset,
  name: string,
  weeks: number,
) {
  if (!name) return { error: "name is required" };
  const matched = resolveExerciseName(dataset, name);
  if (!matched) {
    return {
      error: `No exercise matching "${name}". Try search_exercise.`,
    };
  }

  const cutoff = subWeeks(dataset.dateRange.end, weeks);
  const points: Array<{
    date: string;
    workingSets: number;
    topSet: { weightKg: number; reps: number } | null;
    maxWeightKg: number;
    volumeKg: number;
    est1RMKg: number;
    rpe: number | null;
  }> = [];

  let allTimeMaxWeight = 0;
  let allTimeMax1RM = 0;
  let allTimeMaxWeightDate: Date | null = null;

  for (const session of dataset.sessions) {
    if (session.date < cutoff) continue;
    const sets = session.sets.filter(
      (s) => s.exerciseName === matched && s.setType !== "warmup",
    );
    if (sets.length === 0) continue;

    let maxWeight = 0;
    let topSet: { weightKg: number; reps: number } | null = null;
    let volume = 0;
    let max1RM = 0;
    let rpeSum = 0;
    let rpeCount = 0;
    for (const s of sets) {
      volume += s.volume;
      if (s.weight > maxWeight) {
        maxWeight = s.weight;
        topSet = { weightKg: s.weight, reps: s.reps };
      }
      const rm = epley1RM(s.weight, s.reps);
      if (rm > max1RM) max1RM = rm;
      if (s.rpe != null) {
        rpeSum += s.rpe;
        rpeCount += 1;
      }
    }
    if (maxWeight > allTimeMaxWeight) {
      allTimeMaxWeight = maxWeight;
      allTimeMaxWeightDate = session.date;
    }
    if (max1RM > allTimeMax1RM) allTimeMax1RM = max1RM;

    points.push({
      date: format(session.date, "yyyy-MM-dd"),
      workingSets: sets.length,
      topSet,
      maxWeightKg: Math.round(maxWeight * 100) / 100,
      volumeKg: Math.round(volume),
      est1RMKg: Math.round(max1RM * 10) / 10,
      rpe: rpeCount > 0 ? Math.round((rpeSum / rpeCount) * 10) / 10 : null,
    });
  }

  return {
    exercise: matched,
    windowWeeks: weeks,
    sessionCount: points.length,
    allTimeMaxWeightKg: Math.round(allTimeMaxWeight * 100) / 100,
    allTimeMaxWeightDate: allTimeMaxWeightDate
      ? format(allTimeMaxWeightDate, "yyyy-MM-dd")
      : null,
    allTimeEstimated1RMKg: Math.round(allTimeMax1RM * 10) / 10,
    sessions: points,
  };
}

function resolveExerciseName(
  dataset: WorkoutDataset,
  query: string,
): string | null {
  const q = query.toLowerCase().trim();
  if (!q) return null;
  const exact = dataset.exercises.find((e) => e.toLowerCase() === q);
  if (exact) return exact;
  const contains = dataset.exercises.find((e) => e.toLowerCase().includes(q));
  return contains ?? null;
}

function toolRecentSessions(dataset: WorkoutDataset, limit: number) {
  const sessions = [...dataset.sessions]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, limit);

  return {
    sessions: sessions.map((s) => {
      const byExercise = new Map<
        string,
        { sets: number; volume: number; topWeight: number; topReps: number }
      >();
      for (const set of s.sets) {
        if (set.setType === "warmup") continue;
        const cur = byExercise.get(set.exerciseName) ?? {
          sets: 0,
          volume: 0,
          topWeight: 0,
          topReps: 0,
        };
        cur.sets += 1;
        cur.volume += set.volume;
        if (set.weight > cur.topWeight) {
          cur.topWeight = set.weight;
          cur.topReps = set.reps;
        }
        byExercise.set(set.exerciseName, cur);
      }
      return {
        date: format(s.date, "yyyy-MM-dd"),
        workoutName: s.workoutName,
        durationMinutes: s.durationMinutes,
        totalVolumeKg: Math.round(s.totalVolume),
        exercises: [...byExercise.entries()].map(([name, v]) => ({
          name,
          workingSets: v.sets,
          volumeKg: Math.round(v.volume),
          topSet: {
            weightKg: Math.round(v.topWeight * 100) / 100,
            reps: v.topReps,
          },
        })),
      };
    }),
  };
}

function toolPRs(dataset: WorkoutDataset, limit: number) {
  return {
    prs: detectPRs(dataset, limit).map((p) => ({
      exercise: p.exercise,
      metric: p.metric,
      value: p.value,
      date: format(p.date, "yyyy-MM-dd"),
    })),
  };
}

function toolBodyMeasurements(
  measurements: BodyMeasurement[],
  weeks: number,
) {
  if (measurements.length === 0) {
    return {
      count: 0,
      note: "User has not logged any body measurements.",
      entries: [],
    };
  }
  const cutoff = Date.now() - weeks * 7 * 24 * 60 * 60 * 1000;
  const filtered = measurements
    .filter((m) => m.date >= cutoff)
    .sort((a, b) => a.date - b.date);

  const weights = filtered
    .filter((m) => m.weightKg != null)
    .map((m) => m.weightKg as number);
  const trend =
    weights.length >= 2
      ? Math.round((weights[weights.length - 1] - weights[0]) * 100) / 100
      : null;

  return {
    count: filtered.length,
    windowWeeks: weeks,
    weightChangeKg: trend,
    entries: filtered.map((m) => ({
      date: format(new Date(m.date), "yyyy-MM-dd"),
      weightKg: m.weightKg,
      bodyFatPct: m.bodyFatPct,
      measurements: m.measurements,
    })),
  };
}

function toolMuscleBreakdown(dataset: WorkoutDataset, weeks: number) {
  const balance = computeMuscleBalance(dataset, weeks);

  // Also drill down into specific muscle groups, not just buckets.
  const end = dataset.dateRange.end;
  const start = subWeeks(end, weeks);
  const sessions = sessionsInRange(dataset.sessions, start, end);
  const byMuscle = new Map<string, number>();
  for (const session of sessions) {
    for (const set of session.sets) {
      if (set.volume <= 0 || set.setType === "warmup") continue;
      const { primary, secondary } = lookupMuscles(set.exerciseName);
      byMuscle.set(primary, (byMuscle.get(primary) ?? 0) + set.volume);
      for (const sec of secondary) {
        byMuscle.set(sec, (byMuscle.get(sec) ?? 0) + set.volume * 0.5);
      }
    }
  }

  const totalByBucket = Object.fromEntries(
    BUCKETS.map((b: Bucket) => [b, 0]),
  ) as Record<Bucket, number>;
  for (const b of balance.buckets) totalByBucket[b.bucket] = b.volume;

  return {
    windowWeeks: weeks,
    totalVolumeKg: Math.round(balance.totalVolume),
    buckets: balance.buckets.map((b) => ({
      bucket: b.bucket,
      volumeKg: Math.round(b.volume),
      percent: Math.round(b.percent * 10) / 10,
    })),
    muscleGroups: [...byMuscle.entries()]
      .map(([muscle, volume]) => ({
        muscle,
        bucket: GROUP_TO_BUCKET[muscle as keyof typeof GROUP_TO_BUCKET],
        volumeKg: Math.round(volume),
      }))
      .sort((a, b) => b.volumeKg - a.volumeKg),
    warnings: balance.warnings,
  };
}

function toolSearchExercise(dataset: WorkoutDataset, query: string) {
  const q = query.toLowerCase().trim();
  if (!q) return { matches: [] };
  const matches = dataset.exercises
    .filter((e) => e.toLowerCase().includes(q))
    .slice(0, 15);
  return { query, matches };
}

// Re-export helpers used inside tool runs (avoid unused-import warnings).
export { totalVolume };
