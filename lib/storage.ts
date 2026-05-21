import { get, set, del } from "idb-keyval";
import type { WorkoutDataset } from "./types";

const DATASET_KEY = "setdown-dataset-v1";

export interface StoredDataset {
  importedAt: string;
  fileName: string;
  sessions: {
    id: string;
    date: string;
    workoutName: string;
    durationMinutes: number | null;
    sets: {
      id: string;
      date: string;
      workoutName: string;
      durationMinutes: number | null;
      exerciseName: string;
      setOrder: string;
      setType: string;
      setIndex: number | null;
      weight: number;
      reps: number;
      distance: number;
      seconds: number;
      rpe: number | null;
      volume: number;
    }[];
    totalVolume: number;
    exerciseCount: number;
  }[];
  exercises: string[];
  dateRange: { start: string; end: string };
}

function serialize(dataset: WorkoutDataset): StoredDataset {
  return {
    importedAt: dataset.importedAt,
    fileName: dataset.fileName,
    sessions: dataset.sessions.map((s) => ({
      ...s,
      date: s.date.toISOString(),
      sets: s.sets.map((set) => ({
        ...set,
        date: set.date.toISOString(),
      })),
    })),
    exercises: dataset.exercises,
    dateRange: {
      start: dataset.dateRange.start.toISOString(),
      end: dataset.dateRange.end.toISOString(),
    },
  };
}

function deserialize(stored: StoredDataset): WorkoutDataset {
  return {
    importedAt: stored.importedAt,
    fileName: stored.fileName,
    exercises: stored.exercises,
    dateRange: {
      start: new Date(stored.dateRange.start),
      end: new Date(stored.dateRange.end),
    },
    sessions: stored.sessions.map((s) => ({
      ...s,
      date: new Date(s.date),
      sets: s.sets.map((set) => ({
        ...set,
        date: new Date(set.date),
        setType: set.setType as WorkoutDataset["sessions"][0]["sets"][0]["setType"],
      })),
    })),
  };
}

export async function saveDataset(dataset: WorkoutDataset): Promise<void> {
  await set(DATASET_KEY, serialize(dataset));
  if (typeof document !== "undefined") {
    document.cookie = "has-data=1; path=/; max-age=31536000; SameSite=Lax";
  }
}

export async function loadDataset(): Promise<WorkoutDataset | null> {
  const stored = await get<StoredDataset>(DATASET_KEY);
  if (!stored) return null;
  return deserialize(stored);
}

export async function clearDataset(): Promise<void> {
  await del(DATASET_KEY);
  if (typeof document !== "undefined") {
    document.cookie = "has-data=; path=/; max-age=0";
  }
}
