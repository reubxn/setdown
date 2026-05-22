"use client";

import { RouteError } from "@/components/error/route-error";

export default function OverviewError({
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
      title="Couldn't load your overview"
      description="Something broke while crunching your numbers. Give it another try."
    />
  );
}
