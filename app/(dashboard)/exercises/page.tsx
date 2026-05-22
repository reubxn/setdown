"use client";

import { Dumbbell } from "lucide-react";
import Link from "next/link";
import { useDataset } from "@/context/dataset-context";
import { PageShell } from "@/components/layout/page-shell";
import { ExerciseList } from "@/components/exercises/exercise-list";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { ExerciseListSkeleton } from "@/components/loading/page-skeletons";

export default function ExercisesPage() {
  const { dataset, loading } = useDataset();

  if (loading) {
    return <ExerciseListSkeleton />;
  }

  if (!dataset) {
    return (
      <PageShell title="Exercises">
        <EmptyState
          icon={Dumbbell}
          title="No exercises yet"
          description="Upload your Strong export to see every exercise you've trained, with 1RM curves and set history."
          action={
            <Link href="/overview">
              <Button variant="primary">Get started</Button>
            </Link>
          }
        />
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
