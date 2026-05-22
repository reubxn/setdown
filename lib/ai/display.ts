// Discriminated union of inline UI payloads the AI chat can render alongside
// its markdown text. The model emits these via `show_*` tools; the tool result
// includes a `display` field which the server forwards to the client over the
// NDJSON event stream and persists onto the assistant chat message.

export interface ExerciseChartPointPayload {
  date: string; // yyyy-MM-dd
  maxWeightKg: number;
  est1RMKg: number;
  volumeKg: number;
}

export interface WorkoutPlanExercise {
  name: string;
  sets: number;
  reps: string; // e.g. "5", "8-10", "AMRAP"
  weight?: number; // kg
  notes?: string;
}

export interface SessionListEntry {
  date: string; // yyyy-MM-dd
  name?: string;
  topLifts: string[];
}

export type ChatDisplay =
  | {
      kind: "exercise_chart";
      exercise: string;
      metric: "max_weight" | "estimated_1rm";
      windowWeeks: number;
      points: ExerciseChartPointPayload[];
    }
  | {
      kind: "workout_plan";
      title: string;
      exercises: WorkoutPlanExercise[];
      notes?: string;
    }
  | {
      kind: "stat_highlight";
      label: string;
      value: string;
      unit?: string;
      delta?: { value: string; direction: "up" | "down" | "flat" };
      context?: string;
    }
  | {
      kind: "session_list";
      sessions: SessionListEntry[];
    };

// Lightweight runtime validator — guards against malformed display payloads
// being pushed onto chat messages either from the model or from storage.
export function isChatDisplay(value: unknown): value is ChatDisplay {
  if (!value || typeof value !== "object") return false;
  const v = value as { kind?: unknown };
  switch (v.kind) {
    case "exercise_chart": {
      const d = v as Partial<Extract<ChatDisplay, { kind: "exercise_chart" }>>;
      return (
        typeof d.exercise === "string" &&
        (d.metric === "max_weight" || d.metric === "estimated_1rm") &&
        typeof d.windowWeeks === "number" &&
        Array.isArray(d.points)
      );
    }
    case "workout_plan": {
      const d = v as Partial<Extract<ChatDisplay, { kind: "workout_plan" }>>;
      return typeof d.title === "string" && Array.isArray(d.exercises);
    }
    case "stat_highlight": {
      const d = v as Partial<Extract<ChatDisplay, { kind: "stat_highlight" }>>;
      return typeof d.label === "string" && typeof d.value === "string";
    }
    case "session_list": {
      const d = v as Partial<Extract<ChatDisplay, { kind: "session_list" }>>;
      return Array.isArray(d.sessions);
    }
    default:
      return false;
  }
}

export function coerceDisplays(value: unknown): ChatDisplay[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isChatDisplay);
}
