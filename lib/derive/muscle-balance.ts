import { subWeeks } from "date-fns";
import type { WorkoutDataset } from "../types";
import { BUCKETS, GROUP_TO_BUCKET, lookupMuscles, type Bucket } from "./muscle-mapping";

export interface BucketVolume {
  bucket: Bucket;
  volume: number;
  percent: number;
}

export interface MuscleBalance {
  buckets: BucketVolume[];
  totalVolume: number;
  warnings: BalanceWarning[];
  windowWeeks: number;
}

export interface BalanceWarning {
  kind: "ratio" | "underworked";
  message: string;
  severity: "info" | "warn";
}

/**
 * Compute volume distribution across high-level buckets over the recent window.
 *
 * Secondary muscles contribute at half weight, matching the convention used in
 * exercise programming software (a row's bicep contribution is partial).
 */
export function computeMuscleBalance(
  dataset: WorkoutDataset,
  windowWeeks = 8,
): MuscleBalance {
  const end = dataset.dateRange.end;
  const start = subWeeks(end, windowWeeks);

  const volumeByBucket = new Map<Bucket, number>(BUCKETS.map((b) => [b, 0]));

  for (const session of dataset.sessions) {
    if (session.date < start || session.date > end) continue;
    for (const set of session.sets) {
      if (set.volume <= 0) continue;
      if (set.setType === "warmup") continue;

      const { primary, secondary } = lookupMuscles(set.exerciseName);
      const primaryBucket = GROUP_TO_BUCKET[primary];
      if (primaryBucket === "other") continue;
      volumeByBucket.set(
        primaryBucket,
        (volumeByBucket.get(primaryBucket) ?? 0) + set.volume,
      );

      for (const sec of secondary) {
        const secBucket = GROUP_TO_BUCKET[sec];
        if (secBucket === "other" || secBucket === primaryBucket) continue;
        volumeByBucket.set(
          secBucket,
          (volumeByBucket.get(secBucket) ?? 0) + set.volume * 0.5,
        );
      }
    }
  }

  const totalVolume = Array.from(volumeByBucket.values()).reduce(
    (s, v) => s + v,
    0,
  );

  const buckets: BucketVolume[] = BUCKETS.map((bucket) => {
    const volume = volumeByBucket.get(bucket) ?? 0;
    return {
      bucket,
      volume,
      percent: totalVolume > 0 ? (volume / totalVolume) * 100 : 0,
    };
  });

  return {
    buckets,
    totalVolume,
    warnings: deriveWarnings(buckets),
    windowWeeks,
  };
}

function deriveWarnings(buckets: BucketVolume[]): BalanceWarning[] {
  const out: BalanceWarning[] = [];
  const byBucket = Object.fromEntries(buckets.map((b) => [b.bucket, b])) as Record<Bucket, BucketVolume>;

  const push = byBucket.push?.volume ?? 0;
  const pull = byBucket.pull?.volume ?? 0;

  if (push > 0 && pull > 0) {
    const ratio = push / pull;
    if (ratio > 1.5) {
      out.push({
        kind: "ratio",
        severity: "warn",
        message: `Push volume is ${ratio.toFixed(1)}× pull. Consider adding rows or pulldowns.`,
      });
    } else if (ratio < 0.66) {
      out.push({
        kind: "ratio",
        severity: "warn",
        message: `Pull volume is ${(1 / ratio).toFixed(1)}× push. Consider adding pressing work.`,
      });
    }
  }

  if (push > 0 && (byBucket.legs?.volume ?? 0) === 0) {
    out.push({
      kind: "underworked",
      severity: "warn",
      message: "No leg volume in this window.",
    });
  }

  if ((byBucket.core?.volume ?? 0) === 0 && buckets.some((b) => b.volume > 0)) {
    out.push({
      kind: "underworked",
      severity: "info",
      message: "No direct core work in this window.",
    });
  }

  return out;
}

export const BUCKET_LABELS: Record<Bucket, string> = {
  push: "Push",
  pull: "Pull",
  legs: "Legs",
  core: "Core",
  arms: "Arms",
  other: "Other",
};
