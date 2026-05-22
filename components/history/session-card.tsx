"use client";

import Link from "next/link";
import { format } from "date-fns";
import { useMemo } from "react";
import type { WorkoutSession } from "@/lib/types";
import { formatDuration, formatVolume } from "@/lib/metrics";

function topExercises(session: WorkoutSession, limit = 3): string[] {
  const volumes = new Map<string, number>();
  for (const set of session.sets) {
    volumes.set(
      set.exerciseName,
      (volumes.get(set.exerciseName) ?? 0) + set.volume,
    );
  }
  return [...volumes.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name]) => name);
}

export function SessionCard({ session }: { session: WorkoutSession }) {
  const top = useMemo(() => topExercises(session), [session]);

  return (
    <Link
      href={`/history/${encodeURIComponent(session.id)}`}
      className="@container block rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4 transition-colors hover:border-[var(--border-strong)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-[var(--text-primary)] capitalize">
            {session.workoutName}
          </p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            {format(session.date, "EEE, MMM d, yyyy")}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-sm font-semibold tabular-nums text-[var(--accent)]">
            {formatVolume(session.totalVolume)}
          </p>
          <p className="text-xs text-[var(--text-muted)] tabular-nums">
            {formatDuration(session.durationMinutes)}
          </p>
        </div>
      </div>
      {top.length > 0 ? (
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {top.map((name) => (
            <li
              key={name}
              className="truncate rounded bg-[var(--bg-sunken)] px-2 py-0.5 text-xs text-[var(--text-secondary)]"
            >
              {name}
            </li>
          ))}
        </ul>
      ) : null}
      <p className="mt-3 text-xs text-[var(--text-muted)]">
        {session.exerciseCount} exercises · {session.sets.length} sets
      </p>
    </Link>
  );
}
