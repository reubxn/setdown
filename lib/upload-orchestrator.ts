import { parseStrongCsv, slugifyExercise } from "./parse-strong-csv";
import { saveDataset } from "./storage";
import { convex } from "./convex-client";
import { api } from "@/convex/_generated/api";
import type { WorkoutDataset, WorkoutSet } from "./types";

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

function toConvexSets(sets: WorkoutSet[]) {
  return sets.map((s, i) => ({
    date: s.date.getTime(),
    exerciseName: s.exerciseName,
    exerciseSlug: slugify(s.exerciseName),
    setOrder: s.setIndex ?? i,
    weightKg: s.weight,
    reps: s.reps,
    rpe: s.rpe ?? undefined,
    durationSec: s.seconds > 0 ? s.seconds : undefined,
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
  const allSets = dataset.sessions.flatMap((s) => s.sets);
  if (allSets.length === 0) {
    const msg = "No workout sets found in file.";
    emit({ stage: "error", error: msg });
    throw new Error(msg);
  }

  emit({ stage: "saving", rowCount: allSets.length });
  if (isAuthenticated) {
    await convex.mutation(api.mutations.uploadDataset.default, {
      sourceFilename: file.name,
      sets: toConvexSets(allSets),
    });
    emit({ stage: "done", rowCount: allSets.length });
    return { dataset, rowCount: allSets.length, destination: "convex" };
  }

  await saveDataset(dataset);
  emit({ stage: "done", rowCount: allSets.length });
  return { dataset, rowCount: allSets.length, destination: "indexeddb" };
}

export { slugifyExercise };
