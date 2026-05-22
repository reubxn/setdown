import type { WorkoutDataset, WorkoutSet } from "@/lib/types";

export type OneRMFormula = "epley" | "brzycki" | "lombardi";

export interface OneRMPoint {
  date: Date;
  est1RM: number;
  weight: number;
  reps: number;
}

export function oneRM(
  weight: number,
  reps: number,
  formula: OneRMFormula = "epley",
): number {
  if (weight <= 0 || reps <= 0) return 0;
  if (reps === 1) return weight;
  switch (formula) {
    case "epley":
      return weight * (1 + reps / 30);
    case "brzycki":
      if (reps >= 37) return 0;
      return weight * (36 / (37 - reps));
    case "lombardi":
      return weight * Math.pow(reps, 0.1);
  }
}

export function setOneRM(
  set: Pick<WorkoutSet, "weight" | "reps">,
  formula: OneRMFormula = "epley",
): number {
  return oneRM(set.weight, set.reps, formula);
}

export function exerciseOneRMSeries(
  dataset: WorkoutDataset,
  exerciseName: string,
  formula: OneRMFormula = "epley",
): OneRMPoint[] {
  const points: OneRMPoint[] = [];
  for (const session of dataset.sessions) {
    let best: OneRMPoint | null = null;
    for (const set of session.sets) {
      if (set.exerciseName !== exerciseName) continue;
      if (set.setType === "warmup") continue;
      if (set.weight <= 0 || set.reps <= 0) continue;
      const est = oneRM(set.weight, set.reps, formula);
      if (!best || est > best.est1RM) {
        best = {
          date: session.date,
          est1RM: Math.round(est * 10) / 10,
          weight: set.weight,
          reps: set.reps,
        };
      }
    }
    if (best) points.push(best);
  }
  return points.sort((a, b) => a.date.getTime() - b.date.getTime());
}

export function maxOneRM(
  dataset: WorkoutDataset,
  exerciseName: string,
  formula: OneRMFormula = "epley",
): OneRMPoint | null {
  let best: OneRMPoint | null = null;
  for (const session of dataset.sessions) {
    for (const set of session.sets) {
      if (set.exerciseName !== exerciseName) continue;
      if (set.setType === "warmup") continue;
      if (set.weight <= 0 || set.reps <= 0) continue;
      const est = oneRM(set.weight, set.reps, formula);
      if (!best || est > best.est1RM) {
        best = {
          date: session.date,
          est1RM: Math.round(est * 10) / 10,
          weight: set.weight,
          reps: set.reps,
        };
      }
    }
  }
  return best;
}
