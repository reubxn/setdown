"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { ArrowLeft } from "lucide-react";
import { useDataset } from "@/context/dataset-context";
import { formatDuration, formatVolume } from "@/lib/metrics";
import { PageShell } from "@/components/layout/page-shell";

export default function SessionDetailPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { dataset } = useDataset();

  const session = useMemo(() => {
    if (!dataset || !sessionId) return null;
    const decoded = decodeURIComponent(sessionId);
    return dataset.sessions.find((s) => s.id === decoded) ?? null;
  }, [dataset, sessionId]);

  const byExercise = useMemo(() => {
    if (!session) return [];
    const map = new Map<string, typeof session.sets>();
    for (const set of session.sets) {
      const arr = map.get(set.exerciseName) ?? [];
      arr.push(set);
      map.set(set.exerciseName, arr);
    }
    return [...map.entries()];
  }, [session]);

  if (!session) {
    return (
      <div className="px-4 py-8">
        <p className="text-[var(--text-muted)]">Session not found.</p>
        <Link href="/history" className="mt-4 text-sm text-[var(--accent-blue)]">
          ← Back to history
        </Link>
      </div>
    );
  }

  return (
    <PageShell
      title={session.workoutName}
      subtitle={format(session.date, "EEEE, MMM d, yyyy · h:mm a")}
      headerExtra={
        <Link
          href="/history"
          className="inline-flex items-center gap-1 text-sm text-[var(--accent-blue)]"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
          History
        </Link>
      }
      className="pb-8"
    >
      <p className="-mt-4 mb-6 text-sm text-[var(--text-muted)]">
        {formatDuration(session.durationMinutes)}
      </p>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {byExercise.map(([exercise, sets]) => (
          <div key={exercise} className="rounded-2xl bg-[var(--card)] p-4">
            <p className="font-medium text-sm">{exercise}</p>
            <ul className="mt-2 space-y-1">
              {sets.map((set) => (
                <li
                  key={set.id}
                  className="flex justify-between text-sm text-[var(--text-muted)]"
                >
                  <span>
                    Set {set.setOrder}
                    {set.setType === "warmup" && " (warm-up)"}
                    {set.setType === "dropset" && " (drop)"}
                    {set.setType === "failure" && " (failure)"}
                  </span>
                  <span className="tabular-nums text-white">
                    {set.weight} kg × {set.reps}
                    {set.volume > 0 && (
                      <span className="text-[var(--text-muted)] ml-2">
                        ({Math.round(set.volume)})
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-[var(--accent-green)]/30 bg-[var(--card)] p-6 text-center lg:col-span-2 xl:col-span-3">
        <p className="text-xs tracking-[0.08em] text-[var(--text-muted)] uppercase">
          Session volume
        </p>
        <p className="mt-1 text-2xl font-bold text-[var(--accent-green)] lg:text-3xl">
          {formatVolume(session.totalVolume)} kg·reps
        </p>
      </div>
    </PageShell>
  );
}
