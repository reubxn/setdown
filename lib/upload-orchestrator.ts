import { parseStrongCsv, slugifyExercise } from "./parse-strong-csv";
import { saveDataset } from "./storage";
import { convex } from "./convex-client";
import { api } from "@/convex/_generated/api";
import type { WorkoutDataset, WorkoutSession, WorkoutSet } from "./types";

export type UploadStage =
  | "idle"
  | "reading"
  | "parsing"
  | "validating"
  | "saving"
  | "done"
  | "error";

export interface UploadProgress {
  stage: UploadStage;
  rowCount?: number;
  error?: string;
}

export interface UploadOptions {
  isAuthenticated: boolean;
  onProgress?: (p: UploadProgress) => void;
}

export interface UploadResult {
  dataset: WorkoutDataset;
  rowCount: number;
  destination: "indexeddb" | "convex";
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

interface SetWithSessionCtx {
  set: WorkoutSet;
  session: WorkoutSession;
  fallbackOrder: number;
}

function flattenWithSessionContext(
  sessions: WorkoutSession[],
): SetWithSessionCtx[] {
  const out: SetWithSessionCtx[] = [];
  let i = 0;
  for (const session of sessions) {
    for (const set of session.sets) {
      out.push({ set, session, fallbackOrder: i++ });
    }
  }
  return out;
}

function toConvexSets(rows: SetWithSessionCtx[]) {
  return rows.map(({ set, session, fallbackOrder }) => ({
    date: set.date.getTime(),
    exerciseName: set.exerciseName,
    exerciseSlug: slugify(set.exerciseName),
    setOrder: set.setIndex ?? fallbackOrder,
    weightKg: set.weight,
    reps: set.reps,
    rpe: set.rpe ?? undefined,
    durationSec: set.seconds > 0 ? set.seconds : undefined,
    setType: set.setType,
    workoutName: session.workoutName || undefined,
    sessionDurationMinutes:
      session.durationMinutes != null ? session.durationMinutes : undefined,
  }));
}

export async function uploadCsvFile(
  file: File,
  opts: UploadOptions,
): Promise<UploadResult> {
  const { isAuthenticated, onProgress } = opts;
  const emit = (p: UploadProgress) => onProgress?.(p);

  emit({ stage: "reading" });
  const text = await file.text();

  emit({ stage: "parsing" });
  const result = parseStrongCsv(text, file.name);
  if ("error" in result) {
    emit({ stage: "error", error: result.error });
    throw new Error(result.error);
  }

  emit({ stage: "validating" });
  const dataset = result.dataset;
  // Flatten while preserving parent-session context so we can write each
  // set's workoutName / sessionDurationMinutes through to Convex.
  const rows = flattenWithSessionContext(dataset.sessions);
  if (rows.length === 0) {
    const msg = "No workout sets found in file.";
    emit({ stage: "error", error: msg });
    throw new Error(msg);
  }

  emit({ stage: "saving", rowCount: rows.length });
  if (isAuthenticated) {
    await convex.mutation(api.mutations.uploadDataset.default, {
      sourceFilename: file.name,
      sets: toConvexSets(rows),
    });
    emit({ stage: "done", rowCount: rows.length });
    return { dataset, rowCount: rows.length, destination: "convex" };
  }

  await saveDataset(dataset);
  emit({ stage: "done", rowCount: rows.length });
  return { dataset, rowCount: rows.length, destination: "indexeddb" };
}

export { slugifyExercise };
