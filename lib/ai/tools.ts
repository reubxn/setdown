// Tool definitions + server-side implementations for the AI coach.
// The client sends a serialized `WorkoutDataset` (Dates → ISO strings); we
// rehydrate it once and run tools against the in-memory dataset.

import type Anthropic from "@anthropic-ai/sdk";
import { format, subWeeks } from "date-fns";
import type {
  SetType,
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
import type {
  ChatDisplay,
  ExerciseChartPointPayload,
  SessionListEntry,
  WorkoutPlanExercise,
} from "./display";

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

// ── Convex → client-shape reconstructor ─────────────────────────────────
//
// The chat route stores a flat list of `workoutSets` rows in Convex. To run
// the AI tools we need to rebuild the client-side `WorkoutDataset` shape
// (sessions → sets, plus exercise list + date range). Legacy rows uploaded
// before we added `setType` / `workoutName` / `sessionDurationMinutes` will
// have those fields undefined; we fill in sensible defaults below.

export interface ConvexWorkoutRow {
  _id: string;
  date: number;
  exerciseName: string;
  setOrder: number;
  weightKg: number;
  reps: number;
  rpe?: number;
  durationSec?: number;
  setType?: SetType;
  workoutName?: string;
  sessionDurationMinutes?: number;
}

export interface ConvexDatasetMeta {
  importedAt: number;
  fileName: string;
  dateRange: { start: number; end: number };
  totalSets: number;
}

function setVolume(weight: number, reps: number, setType: SetType): number {
  if (reps <= 0 || setType === "warmup") return 0;
  return weight * reps;
}

export function datasetFromConvexRows(
  meta: ConvexDatasetMeta,
  rows: ConvexWorkoutRow[],
): WorkoutDataset {
  // Group rows into sessions keyed by (date-truncated-to-day, workoutName).
  // Every set within a Strong session shares the same `date` value at
  // set-level granularity, but to be defensive we floor to day precision.
  const dayMs = 24 * 60 * 60 * 1000;
  const sessionMap = new Map<
    string,
    {
      dateMs: number;
      workoutName: string;
      durationMinutes: number | null;
      sets: WorkoutSet[];
    }
  >();

  for (const row of rows) {
    const dayBucket = Math.floor(row.date / dayMs) * dayMs;
    const workoutName = row.workoutName ?? "Workout";
    const key = `${dayBucket}|${workoutName}`;

    const setType: SetType = row.setType ?? "working";
    const set: WorkoutSet = {
      id: String(row._id),
      date: new Date(row.date),
      workoutName,
      durationMinutes:
        row.sessionDurationMinutes != null ? row.sessionDurationMinutes : null,
      exerciseName: row.exerciseName,
      setOrder: String(row.setOrder),
      setType,
      setIndex: row.setOrder,
      weight: row.weightKg,
      reps: row.reps,
      distance: 0,
      seconds: row.durationSec ?? 0,
      rpe: row.rpe ?? null,
      volume: setVolume(row.weightKg, row.reps, setType),
    };

    const entry = sessionMap.get(key);
    if (entry) {
      entry.sets.push(set);
    } else {
      sessionMap.set(key, {
        dateMs: row.date,
        workoutName,
        durationMinutes:
          row.sessionDurationMinutes != null
            ? row.sessionDurationMinutes
            : null,
        sets: [set],
      });
    }
  }

  const sessions: WorkoutSession[] = [];
  for (const [key, group] of sessionMap) {
    const exercises = new Set(group.sets.map((s) => s.exerciseName));
    sessions.push({
      id: key,
      date: new Date(group.dateMs),
      workoutName: group.workoutName,
      durationMinutes: group.durationMinutes,
      sets: group.sets,
      totalVolume: group.sets.reduce((sum, s) => sum + s.volume, 0),
      exerciseCount: exercises.size,
    });
  }
  // Match the client-side parser: newest first.
  sessions.sort((a, b) => b.date.getTime() - a.date.getTime());

  const exerciseSet = new Set<string>();
  for (const row of rows) exerciseSet.add(row.exerciseName);
  const exercises = [...exerciseSet].sort();

  return {
    importedAt: new Date(meta.importedAt).toISOString(),
    fileName: meta.fileName,
    sessions,
    exercises,
    dateRange: {
      start: new Date(meta.dateRange.start),
      end: new Date(meta.dateRange.end),
    },
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
    name: "show_exercise_chart",
    description:
      "Render an inline chart of an exercise's progression to the user. Use this when the user asks about a specific lift's history, trajectory, or progress. The chart appears beneath your text reply.",
    input_schema: {
      type: "object" as const,
      properties: {
        name: {
          type: "string",
          description:
            "Exact exercise name. Use search_exercise first if the user's phrasing may not match.",
        },
        metric: {
          type: "string",
          enum: ["max_weight", "estimated_1rm"],
          description:
            "Which series to plot. Default estimated_1rm — it smooths over rep-range variation.",
        },
        weeks: {
          type: "number",
          description:
            "How many weeks of history to plot. Defaults to 16. Use 52+ for long-term progression.",
        },
      },
      required: ["name"],
    },
  },
  {
    name: "show_workout_plan",
    description:
      "Render an inline workout plan card listing exercises with sets, reps, and target weight. Use this whenever you propose a session (push day, pull day, leg day, accessory work, etc.). Always include this when suggesting a workout — don't just describe it in prose.",
    input_schema: {
      type: "object" as const,
      properties: {
        title: {
          type: "string",
          description: "Short title e.g. \"Push Day\" or \"Heavy Lower\".",
        },
        exercises: {
          type: "array",
          description: "Ordered list of exercises in the workout.",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              sets: { type: "number" },
              reps: {
                type: "string",
                description: "Reps as text — e.g. \"5\", \"8-10\", \"AMRAP\".",
              },
              weight: {
                type: "number",
                description: "Target working weight in kg. Optional.",
              },
              notes: { type: "string" },
            },
            required: ["name", "sets", "reps"],
          },
        },
        notes: {
          type: "string",
          description: "Optional one-line note about pacing, RPE target, etc.",
        },
      },
      required: ["title", "exercises"],
    },
  },
  {
    name: "show_stat",
    description:
      "Render a single big-number callout card. Use sparingly to highlight one headline number — a PR value, volume change %, sessions/week, etc. Don't use for every reply.",
    input_schema: {
      type: "object" as const,
      properties: {
        label: {
          type: "string",
          description: "Short label e.g. \"Bench 1RM\" or \"Volume vs prior 4 wks\".",
        },
        value: {
          type: "string",
          description: "Formatted value e.g. \"102.5\" or \"+18%\".",
        },
        unit: {
          type: "string",
          description: "Optional unit suffix like \"kg\", \"sessions/wk\".",
        },
        delta: {
          type: "object",
          properties: {
            value: { type: "string" },
            direction: { type: "string", enum: ["up", "down", "flat"] },
          },
          required: ["value", "direction"],
        },
        context: {
          type: "string",
          description: "Optional one-line context e.g. \"set on Mar 12\".",
        },
      },
      required: ["label", "value"],
    },
  },
  {
    name: "show_session_list",
    description:
      "Render a compact list of recent sessions (date + top lifts). Use when the user asks 'what did I do recently' or similar.",
    input_schema: {
      type: "object" as const,
      properties: {
        limit: {
          type: "number",
          description: "How many recent sessions to show (default 5, max 10).",
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
}

// ── Tool runner ──────────────────────────────────────────────────────────

export interface ToolRunResult {
  /** JSON payload sent back to the model as tool_result content. */
  payload: unknown;
  /** Optional inline UI payload to render in the chat message. */
  display?: ChatDisplay;
}

export function runTool(
  name: string,
  input: unknown,
  ctx: ToolContext,
): ToolRunResult {
  const args = (input ?? {}) as Record<string, unknown>;
  switch (name) {
    case "get_overview_stats":
      return { payload: toolOverview(ctx.dataset) };
    case "get_top_exercises":
      return {
        payload: toolTopExercises(
          ctx.dataset,
          toNum(args.weeks, 4),
          Math.min(toNum(args.limit, 8), 20),
        ),
      };
    case "get_exercise_history":
      return {
        payload: toolExerciseHistory(
          ctx.dataset,
          toStr(args.name),
          toNum(args.weeks, 16),
        ),
      };
    case "get_recent_sessions":
      return {
        payload: toolRecentSessions(
          ctx.dataset,
          Math.min(toNum(args.limit, 5), 20),
        ),
      };
    case "get_prs":
      return {
        payload: toolPRs(ctx.dataset, Math.min(toNum(args.limit, 10), 25)),
      };
    case "get_muscle_group_breakdown":
      return {
        payload: toolMuscleBreakdown(ctx.dataset, toNum(args.weeks, 8)),
      };
    case "search_exercise":
      return { payload: toolSearchExercise(ctx.dataset, toStr(args.query)) };
    case "show_exercise_chart":
      return toolShowExerciseChart(
        ctx.dataset,
        toStr(args.name),
        toStr(args.metric) === "max_weight" ? "max_weight" : "estimated_1rm",
        toNum(args.weeks, 16),
      );
    case "show_workout_plan":
      return toolShowWorkoutPlan(args);
    case "show_stat":
      return toolShowStat(args);
    case "show_session_list":
      return toolShowSessionList(
        ctx.dataset,
        Math.min(toNum(args.limit, 5), 10),
      );
    default:
      return { payload: { error: `Unknown tool: ${name}` } };
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

// ── Display-producing tools ──────────────────────────────────────────────

function toolShowExerciseChart(
  dataset: WorkoutDataset,
  name: string,
  metric: "max_weight" | "estimated_1rm",
  weeks: number,
): ToolRunResult {
  const matched = resolveExerciseName(dataset, name);
  if (!matched) {
    return {
      payload: {
        error: `No exercise matching "${name}". Try search_exercise first.`,
      },
    };
  }

  const cutoff = subWeeks(dataset.dateRange.end, weeks);
  const points: ExerciseChartPointPayload[] = [];
  for (const session of dataset.sessions) {
    if (session.date < cutoff) continue;
    const sets = session.sets.filter(
      (s) => s.exerciseName === matched && s.setType !== "warmup",
    );
    if (sets.length === 0) continue;
    let maxWeight = 0;
    let max1RM = 0;
    let volume = 0;
    for (const s of sets) {
      volume += s.volume;
      if (s.weight > maxWeight) maxWeight = s.weight;
      const rm = epley1RM(s.weight, s.reps);
      if (rm > max1RM) max1RM = rm;
    }
    points.push({
      date: format(session.date, "yyyy-MM-dd"),
      maxWeightKg: Math.round(maxWeight * 100) / 100,
      est1RMKg: Math.round(max1RM * 10) / 10,
      volumeKg: Math.round(volume),
    });
  }

  points.sort((a, b) => a.date.localeCompare(b.date));

  const display: ChatDisplay = {
    kind: "exercise_chart",
    exercise: matched,
    metric,
    windowWeeks: weeks,
    points,
  };

  return {
    payload: {
      rendered: "exercise_chart",
      exercise: matched,
      metric,
      pointCount: points.length,
      windowWeeks: weeks,
    },
    display,
  };
}

function toolShowWorkoutPlan(args: Record<string, unknown>): ToolRunResult {
  const title = toStr(args.title).trim() || "Workout";
  const rawExercises = Array.isArray(args.exercises) ? args.exercises : [];
  const exercises: WorkoutPlanExercise[] = [];
  for (const raw of rawExercises) {
    if (!raw || typeof raw !== "object") continue;
    const r = raw as Record<string, unknown>;
    const name = toStr(r.name).trim();
    if (!name) continue;
    const sets = toNum(r.sets, 3);
    const reps = toStr(r.reps).trim() || "8";
    const weight =
      typeof r.weight === "number" && Number.isFinite(r.weight)
        ? r.weight
        : undefined;
    const notes = toStr(r.notes).trim() || undefined;
    exercises.push({ name, sets, reps, weight, notes });
  }

  if (exercises.length === 0) {
    return { payload: { error: "show_workout_plan requires exercises[]." } };
  }

  const notes = toStr(args.notes).trim() || undefined;
  const display: ChatDisplay = {
    kind: "workout_plan",
    title,
    exercises,
    notes,
  };
  return {
    payload: {
      rendered: "workout_plan",
      title,
      exerciseCount: exercises.length,
    },
    display,
  };
}

function toolShowStat(args: Record<string, unknown>): ToolRunResult {
  const label = toStr(args.label).trim();
  const value = toStr(args.value).trim();
  if (!label || !value) {
    return { payload: { error: "show_stat requires label and value." } };
  }
  const unit = toStr(args.unit).trim() || undefined;
  const context = toStr(args.context).trim() || undefined;
  let delta: { value: string; direction: "up" | "down" | "flat" } | undefined;
  if (args.delta && typeof args.delta === "object") {
    const d = args.delta as Record<string, unknown>;
    const dv = toStr(d.value).trim();
    const dir = toStr(d.direction);
    if (dv && (dir === "up" || dir === "down" || dir === "flat")) {
      delta = { value: dv, direction: dir };
    }
  }
  const display: ChatDisplay = {
    kind: "stat_highlight",
    label,
    value,
    unit,
    delta,
    context,
  };
  return {
    payload: { rendered: "stat_highlight", label, value },
    display,
  };
}

function toolShowSessionList(
  dataset: WorkoutDataset,
  limit: number,
): ToolRunResult {
  const sessions = [...dataset.sessions]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, limit);
  const entries: SessionListEntry[] = sessions.map((s) => {
    const byExercise = new Map<string, { weight: number; reps: number }>();
    for (const set of s.sets) {
      if (set.setType === "warmup") continue;
      const cur = byExercise.get(set.exerciseName);
      if (!cur || set.weight > cur.weight) {
        byExercise.set(set.exerciseName, {
          weight: set.weight,
          reps: set.reps,
        });
      }
    }
    const topLifts = [...byExercise.entries()]
      .sort((a, b) => b[1].weight - a[1].weight)
      .slice(0, 3)
      .map(([name, v]) =>
        v.weight > 0 ? `${name} ${v.weight}×${v.reps}` : name,
      );
    return {
      date: format(s.date, "yyyy-MM-dd"),
      name: s.workoutName || undefined,
      topLifts,
    };
  });
  const display: ChatDisplay = { kind: "session_list", sessions: entries };
  return {
    payload: { rendered: "session_list", count: entries.length },
    display,
  };
}

// Re-export helpers used inside tool runs (avoid unused-import warnings).
export { totalVolume };
