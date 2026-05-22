"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import { Trophy } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { detectPRs } from "@/lib/metrics";
import type { WorkoutDataset } from "@/lib/types";
import { usePreferences } from "@/context/preferences-context";

export function RecentPRs({
  dataset,
  limit = 6,
}: {
  dataset: WorkoutDataset;
  limit?: number;
}) {
  const prs = useMemo(() => detectPRs(dataset, limit), [dataset, limit]);
  const { prefs } = usePreferences();

  return (
    <Card padding="lg" className="@container h-full">
      <CardHeader
        title="Recent personal records"
        subtitle={prs.length > 0 ? `Top ${prs.length} by date` : undefined}
      />
      {prs.length === 0 ? (
        <p className="py-8 text-center text-sm text-[var(--text-muted)]">
          No PRs detected yet.
        </p>
      ) : (
        <ul className="divide-y divide-[var(--border-subtle)]">
          {prs.map((pr, i) => (
            <li
              key={`${pr.exercise}-${i}`}
              className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--bg-sunken)] text-[var(--accent)]">
                <Trophy className="h-4 w-4" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                  {pr.exercise}
                </p>
                <p className="truncate text-xs text-[var(--text-muted)]">
                  {pr.metric}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-semibold tabular-nums text-[var(--accent)]">
                  {pr.value} {prefs.units}
                </p>
                <p className="text-[11px] text-[var(--text-muted)]">
                  {format(pr.date, "MMM d")}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
