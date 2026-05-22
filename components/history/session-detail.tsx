"use client";

import { useMemo } from "react";
import Link from "next/link";
import { format } from "date-fns";
import type { WorkoutDataset, WorkoutSession, WorkoutSet } from "@/lib/types";
import { epley1RM, formatDuration, formatVolume } from "@/lib/metrics";
import { usePreferences } from "@/context/preferences-context";

function groupByExercise(session: WorkoutSession): Array<{
  exerciseName: string;
  sets: WorkoutSet[];
  maxWeight: number;
  volume: number;
  topEpley: number;
}> {
  const map = new Map<string, WorkoutSet[]>();
  for (const set of session.sets) {
    const arr = map.get(set.exerciseName) ?? [];
    arr.push(set);
    map.set(set.exerciseName, arr);
  }
  return [...map.entries()].map(([exerciseName, sets]) => {
    let maxWeight = 0;
    let volume = 0;
    let topEpley = 0;
    for (const s of sets) {
      if (s.weight > maxWeight) maxWeight = s.weight;
      volume += s.volume;
      const e = epley1RM(s.weight, s.reps);
      if (e > topEpley) topEpley = e;
    }
    return { exerciseName, sets, maxWeight, volume, topEpley };
  });
}

function previousSessionId(
  dataset: WorkoutDataset,
  exerciseName: string,
  currentSessionDate: Date,
  currentSessionId: string,
): string | null {
  let best: WorkoutSession | null = null;
  for (const s of dataset.sessions) {
    if (s.id === currentSessionId) continue;
    if (s.date.getTime() >= currentSessionDate.getTime()) continue;
    if (!s.sets.some((set) => set.exerciseName === exerciseName)) continue;
    if (!best || s.date.getTime() > best.date.getTime()) best = s;
  }
  return best?.id ?? null;
}

function setLabel(set: WorkoutSet): string {
  if (set.setType === "warmup") return "Warm-up";
  if (set.setType === "dropset") return "Drop";
  if (set.setType === "failure") return "Failure";
  return `Set ${set.setOrder}`;
}

export function SessionDetail({
  session,
  dataset,
}: {
  session: WorkoutSession;
  dataset: WorkoutDataset;
}) {
  const groups = useMemo(() => groupByExercise(session), [session]);
  const { prefs } = usePreferences();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Date" value={format(session.date, "MMM d, yyyy")} />
        <Stat label="Duration" value={formatDuration(session.durationMinutes)} />
        <Stat
          label="Volume"
          value={`${formatVolume(session.totalVolume)} ${prefs.units}·reps`}
          accent
        />
        <Stat
          label="Exercises"
          value={`${session.exerciseCount}`}
          sub={`${session.sets.length} sets`}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 @container lg:grid-cols-2">
        {groups.map((group) => {
          const prevId = previousSessionId(
            dataset,
            group.exerciseName,
            session.date,
            session.id,
          );
          return (
            <div
              key={group.exerciseName}
              className="rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  {group.exerciseName}
                </p>
                {prevId ? (
                  <Link
                    href={`/history/${encodeURIComponent(prevId)}`}
                    className="text-xs text-[var(--accent)] hover:underline"
                  >
                    Previous session →
                  </Link>
                ) : null}
              </div>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--text-muted)]">
                <span>
                  Max{" "}
                  <span className="tabular-nums text-[var(--text-secondary)]">
                    {group.maxWeight} {prefs.units}
                  </span>
                </span>
                <span>
                  Volume{" "}
                  <span className="tabular-nums text-[var(--text-secondary)]">
                    {formatVolume(group.volume)}
                  </span>
                </span>
                <span>
                  Est 1RM{" "}
                  <span className="tabular-nums text-[var(--text-secondary)]">
                    {group.topEpley > 0 ? `${Math.round(group.topEpley)} ${prefs.units}` : "—"}
                  </span>
                </span>
              </div>
              <ul className="mt-3 divide-y divide-[var(--border-subtle)]">
                {group.sets.map((set) => (
                  <li
                    key={set.id}
                    className="flex items-center justify-between py-1.5 text-sm"
                  >
                    <span className="text-[var(--text-muted)]">{setLabel(set)}</span>
                    <span className="tabular-nums text-[var(--text-primary)]">
                      {set.weight} {prefs.units} × {set.reps}
                      {set.volume > 0 ? (
                        <span className="ml-2 text-[var(--text-muted)]">
                          ({Math.round(set.volume)})
                        </span>
                      ) : null}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-3">
      <p className="text-[10px] tracking-[0.08em] text-[var(--text-muted)] uppercase">
        {label}
      </p>
      <p
        className={`mt-1 text-lg font-semibold tabular-nums ${
          accent ? "text-[var(--accent)]" : "text-[var(--text-primary)]"
        }`}
      >
        {value}
      </p>
      {sub ? (
        <p className="text-xs text-[var(--text-muted)] tabular-nums">{sub}</p>
      ) : null}
    </div>
  );
}
