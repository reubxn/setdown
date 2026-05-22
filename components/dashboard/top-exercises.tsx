"use client";

import { useMemo } from "react";
import { Card, CardHeader } from "@/components/ui/card";
import { topExercisesByVolume, formatVolume } from "@/lib/metrics";
import type { WorkoutDataset } from "@/lib/types";

export function TopExercises({
  dataset,
  limit = 6,
  weeks = 4,
}: {
  dataset: WorkoutDataset;
  limit?: number;
  weeks?: number;
}) {
  const items = useMemo(
    () => topExercisesByVolume(dataset, weeks, limit),
    [dataset, weeks, limit]
  );

  const max = items[0]?.volume ?? 0;

  return (
    <Card padding="lg" className="@container h-full">
      <CardHeader
        title="Top exercises by volume"
        subtitle={`Last ${weeks} weeks`}
      />
      {items.length === 0 ? (
        <p className="py-8 text-center text-sm text-[var(--text-muted)]">
          No volume in this range.
        </p>
      ) : (
        <ul className="space-y-2.5">
          {items.map((ex) => {
            const pct = max > 0 ? (ex.volume / max) * 100 : 0;
            return (
              <li key={ex.name} className="flex flex-col gap-1">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="truncate text-sm text-[var(--text-primary)]">
                    {ex.name}
                  </span>
                  <span className="shrink-0 text-xs tabular-nums text-[var(--text-muted)]">
                    {formatVolume(ex.volume)} kg
                  </span>
                </div>
                <div
                  className="h-1.5 w-full rounded-full bg-[var(--bg-sunken)] overflow-hidden"
                  aria-hidden
                >
                  <div
                    className="h-full rounded-full bg-[var(--accent)]"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
