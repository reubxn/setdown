import type { Muscle } from "react-body-highlighter";
import type { WorkoutSet } from "@/lib/types";
import { lookupMuscles, type MuscleGroup } from "./muscle-mapping";

/**
 * Translate our internal MuscleGroup taxonomy → react-body-highlighter Muscle ids.
 * One internal group may map to multiple anatomical muscles (e.g. "back" lights
 * up trapezius + upper-back + lower-back).
 */
const GROUP_TO_MUSCLES: Record<MuscleGroup, Muscle[]> = {
  chest: ["chest"],
  back: ["upper-back", "lower-back", "trapezius"],
  shoulders: ["front-deltoids", "back-deltoids"],
  biceps: ["biceps"],
  triceps: ["triceps"],
  forearms: ["forearm"],
  quads: ["quadriceps"],
  hamstrings: ["hamstring"],
  glutes: ["gluteal"],
  calves: ["calves"],
  core: ["abs", "obliques"],
  cardio: [],
  other: [],
};

export interface HeatmapEntry {
  name: string;
  muscles: Muscle[];
  frequency: number;
}

export interface HeatmapInput {
  sets: WorkoutSet[];
  /** "volume" weights by weight × reps. "count" weights by set count. */
  mode?: "volume" | "count";
}

/**
 * Aggregate volume per muscle group across a set list and bucket into 1–5
 * frequency bands for the highlighter's color ramp.
 *
 * Use for dashboards summarising a date range.
 */
export function buildHeatmapData({
  sets,
  mode = "volume",
}: HeatmapInput): HeatmapEntry[] {
  if (sets.length === 0) return [];

  const volumePerGroup = new Map<MuscleGroup, number>();
  const exerciseGroups = new Map<string, Set<MuscleGroup>>();

  for (const s of sets) {
    const assignment = lookupMuscles(s.exerciseName);
    const groups = new Set<MuscleGroup>([
      assignment.primary,
      ...assignment.secondary,
    ]);
    if (!exerciseGroups.has(s.exerciseName)) {
      exerciseGroups.set(s.exerciseName, groups);
    }
    const contribution = mode === "volume" ? s.weight * s.reps : 1;
    for (const g of groups) {
      volumePerGroup.set(g, (volumePerGroup.get(g) ?? 0) + contribution);
    }
  }

  const max = Math.max(...volumePerGroup.values(), 1);

  const data: HeatmapEntry[] = [];
  for (const [exerciseName, groups] of exerciseGroups) {
    const muscles: Muscle[] = [];
    let avgIntensity = 0;
    let groupCount = 0;
    for (const g of groups) {
      muscles.push(...GROUP_TO_MUSCLES[g]);
      avgIntensity += (volumePerGroup.get(g) ?? 0) / max;
      groupCount += 1;
    }
    if (muscles.length === 0) continue;
    const intensity = groupCount > 0 ? avgIntensity / groupCount : 0;
    const frequency = Math.max(1, Math.min(5, Math.ceil(intensity * 5)));
    data.push({ name: exerciseName, muscles, frequency });
  }

  return data;
}

/**
 * For a single exercise: render primary muscles at full intensity (5),
 * secondary at half (2). Used on /exercises/[slug] and /history/[sessionId].
 *
 * Accepts a list of exercise names — useful for "session view" where multiple
 * exercises contribute. If a muscle appears as primary in one entry and
 * secondary in another, primary wins.
 */
export function buildExerciseHeatmapData(exerciseNames: string[]): HeatmapEntry[] {
  if (exerciseNames.length === 0) return [];

  const data: HeatmapEntry[] = [];
  for (const name of exerciseNames) {
    const assignment = lookupMuscles(name);
    const primary = GROUP_TO_MUSCLES[assignment.primary];
    const secondary = assignment.secondary.flatMap((g) => GROUP_TO_MUSCLES[g]);

    if (primary.length > 0) {
      data.push({ name: `${name} — primary`, muscles: primary, frequency: 5 });
    }
    if (secondary.length > 0) {
      data.push({
        name: `${name} — secondary`,
        muscles: secondary.filter((m) => !primary.includes(m)),
        frequency: 2,
      });
    }
  }
  return data;
}
