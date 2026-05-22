"use client";

import { useState } from "react";
import { format } from "date-fns";
import type { WorkoutSet } from "@/lib/types";
import { Button } from "@/components/ui/button";

interface SetGroup {
  key: string;
  date: Date;
  workoutName: string;
  sets: WorkoutSet[];
}

function groupBySession(sets: WorkoutSet[]): SetGroup[] {
  const map = new Map<string, SetGroup>();
  for (const s of sets) {
    const key = format(s.date, "yyyy-MM-dd") + "::" + s.workoutName;
    const group = map.get(key);
    if (group) {
      group.sets.push(s);
    } else {
      map.set(key, {
        key,
        date: s.date,
        workoutName: s.workoutName,
        sets: [s],
      });
    }
  }
  return [...map.values()].sort(
    (a, b) => b.date.getTime() - a.date.getTime(),
  );
}

export function SetHistoryTable({
  sets,
  initialLimit = 50,
}: {
  sets: WorkoutSet[];
  initialLimit?: number;
}) {
  const [limit, setLimit] = useState(initialLimit);
  const grouped = groupBySession(sets);
  const visible = grouped.slice(0, limit);
  const hasMore = limit < grouped.length;

  if (grouped.length === 0) {
    return (
      <p className="text-sm text-[var(--text-muted)]">No sets logged yet.</p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--border-subtle)]">
        <table className="w-full text-sm">
          <thead className="bg-[var(--bg-sunken)] text-[11px] uppercase tracking-wide text-[var(--text-muted)]">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Date</th>
              <th className="px-3 py-2 text-left font-medium">Workout</th>
              <th className="px-3 py-2 text-right font-medium">Sets</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((g) => (
              <tr
                key={g.key}
                className="border-t border-[var(--border-subtle)] align-top"
              >
                <td className="whitespace-nowrap px-3 py-3 tabular-nums text-[var(--text-secondary)]">
                  {format(g.date, "MMM d, yyyy")}
                </td>
                <td className="px-3 py-3 text-[var(--text-secondary)]">
                  {g.workoutName}
                </td>
                <td className="px-3 py-3">
                  <div className="flex flex-wrap justify-end gap-1.5">
                    {g.sets.map((s) => (
                      <span
                        key={s.id}
                        className="rounded-[var(--radius-sm)] bg-[var(--bg-sunken)] px-2 py-0.5 text-xs tabular-nums text-[var(--text-primary)]"
                        title={
                          s.rpe != null ? `RPE ${s.rpe}` : undefined
                        }
                      >
                        {s.weight}×{s.reps}
                        {s.setType === "warmup" && " W"}
                        {s.setType === "dropset" && " D"}
                        {s.setType === "failure" && " F"}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {hasMore && (
        <div className="flex justify-center">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setLimit((l) => l + 50)}
          >
            Show 50 more
          </Button>
        </div>
      )}
    </div>
  );
}
