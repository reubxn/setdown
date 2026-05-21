import Papa from "papaparse";
import type { SetType, WorkoutDataset, WorkoutSession, WorkoutSet } from "./types";

const REQUIRED_COLUMNS = [
  "Date",
  "Workout Name",
  "Duration",
  "Exercise Name",
  "Set Order",
  "Weight",
  "Reps",
  "Distance",
  "Seconds",
  "RPE",
];

export function parseSetType(setOrder: string): {
  setType: SetType;
  setIndex: number | null;
} {
  const order = setOrder.trim().toUpperCase();
  if (order === "W") return { setType: "warmup", setIndex: null };
  if (order === "D") return { setType: "dropset", setIndex: null };
  if (order === "F") return { setType: "failure", setIndex: null };
  const num = parseInt(order, 10);
  if (!isNaN(num) && num >= 1) return { setType: "working", setIndex: num };
  return { setType: "unknown", setIndex: null };
}

export function parseDuration(duration: string): number | null {
  if (!duration?.trim()) return null;
  const hMatch = duration.match(/(\d+)\s*h/i);
  const mMatch = duration.match(/(\d+)\s*m/i);
  const hours = hMatch ? parseInt(hMatch[1], 10) : 0;
  const minutes = mMatch ? parseInt(mMatch[1], 10) : 0;
  if (hours === 0 && minutes === 0) return null;
  return hours * 60 + minutes;
}

export function parseStrongDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const cleaned = dateStr
    .replace(/\u202f/g, " ")
    .replace(/\u00a0/g, " ")
    .trim();

  const normalized = cleaned
    .replace(/\s*a\.m\./i, " AM")
    .replace(/\s*p\.m\./i, " PM");

  const isoMatch = normalized.match(
    /^(\d{4})-(\d{2})-(\d{2})\s+(\d{1,2}):(\d{2}):(\d{2})\s*(AM|PM)?$/i
  );
  if (isoMatch) {
    let hour = parseInt(isoMatch[4], 10);
    const minute = parseInt(isoMatch[5], 10);
    const second = parseInt(isoMatch[6], 10);
    const ampm = isoMatch[7]?.toUpperCase();
    if (ampm === "PM" && hour < 12) hour += 12;
    if (ampm === "AM" && hour === 12) hour = 0;
    return new Date(
      parseInt(isoMatch[1], 10),
      parseInt(isoMatch[2], 10) - 1,
      parseInt(isoMatch[3], 10),
      hour,
      minute,
      second
    );
  }

  const parsed = new Date(normalized);
  return isNaN(parsed.getTime()) ? null : parsed;
}

function sessionId(date: Date, workoutName: string): string {
  return `${date.toISOString()}::${workoutName}`;
}

function setVolume(weight: number, reps: number, setType: SetType): number {
  if (reps <= 0 || setType === "warmup") return 0;
  return weight * reps;
}

export function validateColumns(headers: string[]): string | null {
  const missing = REQUIRED_COLUMNS.filter((c) => !headers.includes(c));
  if (missing.length > 0) {
    return `Missing columns: ${missing.join(", ")}. Expected Strong export format.`;
  }
  return null;
}

export function parseStrongCsv(
  csvText: string,
  fileName: string
): { dataset: WorkoutDataset } | { error: string } {
  if (csvText.length > 10 * 1024 * 1024) {
    return { error: "File too large. Maximum size is 10 MB." };
  }

  const result = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  if (result.errors.length > 0 && result.data.length === 0) {
    return { error: `CSV parse error: ${result.errors[0].message}` };
  }

  const headers = result.meta.fields ?? [];
  const validationError = validateColumns(headers);
  if (validationError) return { error: validationError };

  const sets: WorkoutSet[] = [];
  let rowIndex = 0;

  for (const row of result.data) {
    rowIndex++;
    const date = parseStrongDate(row["Date"] ?? "");
    if (!date) {
      return { error: `Invalid date on row ${rowIndex}: "${row["Date"]}"` };
    }

    const workoutName = (row["Workout Name"] ?? "").trim();
    const exerciseName = (row["Exercise Name"] ?? "").trim();
    const setOrder = (row["Set Order"] ?? "").trim();
    const { setType, setIndex } = parseSetType(setOrder);
    const weight = parseFloat(row["Weight"] ?? "0") || 0;
    const reps = parseFloat(row["Reps"] ?? "0") || 0;
    const distance = parseFloat(row["Distance"] ?? "0") || 0;
    const seconds = parseFloat(row["Seconds"] ?? "0") || 0;
    const rpeRaw = (row["RPE"] ?? "").trim();
    const rpe = rpeRaw ? parseFloat(rpeRaw) : null;
    const durationMinutes = parseDuration(row["Duration"] ?? "");

    sets.push({
      id: `${rowIndex}`,
      date,
      workoutName,
      durationMinutes,
      exerciseName,
      setOrder,
      setType,
      setIndex,
      weight,
      reps,
      distance,
      seconds,
      rpe,
      volume: setVolume(weight, reps, setType),
    });
  }

  if (sets.length === 0) {
    return { error: "CSV is empty. No workout sets found." };
  }

  const sessionMap = new Map<string, WorkoutSet[]>();
  for (const set of sets) {
    const key = sessionId(set.date, set.workoutName);
    const existing = sessionMap.get(key) ?? [];
    existing.push(set);
    sessionMap.set(key, existing);
  }

  const sessions: WorkoutSession[] = [];
  for (const [key, sessionSets] of sessionMap) {
    const first = sessionSets[0];
    const exercises = new Set(sessionSets.map((s) => s.exerciseName));
    sessions.push({
      id: key,
      date: first.date,
      workoutName: first.workoutName,
      durationMinutes: first.durationMinutes,
      sets: sessionSets,
      totalVolume: sessionSets.reduce((sum, s) => sum + s.volume, 0),
      exerciseCount: exercises.size,
    });
  }

  sessions.sort((a, b) => b.date.getTime() - a.date.getTime());

  const exerciseSet = new Set<string>();
  for (const s of sets) exerciseSet.add(s.exerciseName);
  const exercises = [...exerciseSet].sort();

  const dates = sets.map((s) => s.date.getTime());
  const dataset: WorkoutDataset = {
    importedAt: new Date().toISOString(),
    fileName,
    sessions,
    exercises,
    dateRange: {
      start: new Date(Math.min(...dates)),
      end: new Date(Math.max(...dates)),
    },
  };

  return { dataset };
}

export function slugifyExercise(name: string): string {
  return encodeURIComponent(name.toLowerCase().replace(/\s+/g, "-"));
}

export function exerciseFromSlug(
  slug: string,
  exercises: string[]
): string | null {
  return exercises.find((e) => slugifyExercise(e) === slug) ?? null;
}
