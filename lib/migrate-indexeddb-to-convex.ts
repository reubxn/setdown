import { convex } from "@/lib/convex-client";
import { api } from "@/convex/_generated/api";
import { loadDataset, clearDataset } from "@/lib/storage";
import { slugifyExercise } from "@/lib/parse-strong-csv";
import type { WorkoutDataset, WorkoutSet } from "@/lib/types";

const MAX_MIGRATION_SETS = 100_000;

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

// Sanity-check the deserialized IndexedDB blob before uploading. Guards against
// a corrupted (or attacker-seeded, via separate-origin XSS or a rogue
// extension) IDB record being shipped wholesale to Convex.
function isValidDataset(d: WorkoutDataset | null): d is WorkoutDataset {
  if (!d || typeof d !== "object") return false;
  if (typeof d.fileName !== "string") return false;
  if (!Array.isArray(d.sessions)) return false;
  if (
    !d.dateRange ||
    !(d.dateRange.start instanceof Date) ||
    !(d.dateRange.end instanceof Date)
  ) {
    return false;
  }
  return true;
}

export async function migrateIndexedDbToConvex(): Promise<{
  migrated: boolean;
  rowCount: number;
}> {
  const dataset = await loadDataset();
  if (!dataset) return { migrated: false, rowCount: 0 };

  if (!isValidDataset(dataset)) {
    // Don't ship malformed data to Convex. Leave IDB intact so the user can
    // re-upload from the original CSV.
    return { migrated: false, rowCount: 0 };
  }

  const sets = dataset.sessions.flatMap((session) =>
    Array.isArray(session?.sets)
      ? session.sets
          .filter((s) => s && s.date instanceof Date)
          .map((s, i) => toConvexSet(s, i))
      : [],
  );

  if (sets.length === 0) {
    await clearDataset();
    return { migrated: false, rowCount: 0 };
  }

  if (sets.length > MAX_MIGRATION_SETS) {
    // Refuse rather than throw inside Convex's validator. Leave IDB intact.
    return { migrated: false, rowCount: 0 };
  }

  await convex.mutation(api.mutations.uploadDataset.default, {
    sourceFilename: dataset.fileName,
    sets,
  });

  await clearDataset();
  return { migrated: true, rowCount: sets.length };
}
