"use client";

import { RouteError } from "@/components/error/route-error";

export default function ExerciseDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteError
      error={error}
      reset={reset}
      title="Couldn't load this exercise"
      description="Something went wrong building the charts for this exercise."
    />
  );
}
