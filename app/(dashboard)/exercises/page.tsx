"use client";

import { useDataset } from "@/context/dataset-context";
import { PageShell } from "@/components/layout/page-shell";
import { ExerciseList } from "@/components/exercises/exercise-list";

export default function ExercisesPage() {
  const { dataset, loading } = useDataset();

  if (loading) {
    return (
      <PageShell title="Exercises">
        <p className="text-sm text-[var(--text-muted)]">Loading…</p>
      </PageShell>
    );
  }

  if (!dataset) {
    return (
      <PageShell
        title="Exercises"
        subtitle="Upload a Strong export to see your exercises."
      >
        <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--border-subtle)] p-8 text-center text-sm text-[var(--text-muted)]">
          No dataset loaded.
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Exercises"
      subtitle={`${dataset.exercises.length} exercises across ${dataset.sessions.length} sessions`}
    >
      <ExerciseList dataset={dataset} />
    </PageShell>
  );
}
