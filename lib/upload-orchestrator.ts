import { parseStrongCsv, slugifyExercise } from "./parse-strong-csv";
import { saveDataset } from "./storage";
import type { WorkoutDataset, WorkoutSession } from "./types";

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
  onProgress?: (p: UploadProgress) => void;
}

export interface UploadResult {
  dataset: WorkoutDataset;
  rowCount: number;
}

function countSets(sessions: WorkoutSession[]): number {
  let total = 0;
  for (const session of sessions) {
    total += session.sets.length;
  }
  return total;
}

export async function uploadCsvFile(
  file: File,
  opts: UploadOptions = {},
): Promise<UploadResult> {
  const { onProgress } = opts;
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
  const rowCount = countSets(dataset.sessions);
  if (rowCount === 0) {
    const msg = "No workout sets found in file.";
    emit({ stage: "error", error: msg });
    throw new Error(msg);
  }

  emit({ stage: "saving", rowCount });
  await saveDataset(dataset);
  emit({ stage: "done", rowCount });
  return { dataset, rowCount };
}

export { slugifyExercise };
