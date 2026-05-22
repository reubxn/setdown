"use client";

import { RouteError } from "@/components/error/route-error";

export default function ExercisesError({
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
      title="Couldn't load exercises"
      description="We hit a snag listing your exercises. Try again."
    />
  );
}
