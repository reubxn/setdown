import { convex } from "@/lib/convex-client";
import { api } from "@/convex/_generated/api";
import { loadDataset, clearDataset } from "@/lib/storage";
import { slugifyExercise } from "@/lib/parse-strong-csv";
import type { WorkoutSet } from "@/lib/types";

function toConvexSet(s: WorkoutSet, setOrderIdx: number) {
  return {
    date: s.date.getTime(),
    exerciseName: s.exerciseName,
    exerciseSlug: slugifyExercise(s.exerciseName),
    setOrder: setOrderIdx,
    weightKg: s.weight,
    reps: s.reps,
    rpe: s.rpe ?? undefined,
    durationSec: s.seconds > 0 ? s.seconds : undefined,
  };
}

export async function migrateIndexedDbToConvex(): Promise<{
  migrated: boolean;
  rowCount: number;
}> {
  const dataset = await loadDataset();
  if (!dataset) return { migrated: false, rowCount: 0 };

  const sets = dataset.sessions.flatMap((session) =>
    session.sets.map((s, i) => toConvexSet(s, i)),
  );

  if (sets.length === 0) {
    await clearDataset();
    return { migrated: false, rowCount: 0 };
  }

  await convex.mutation(api.mutations.uploadDataset.default, {
    sourceFilename: dataset.fileName,
    sets,
  });

  await clearDataset();
  return { migrated: true, rowCount: sets.length };
}
