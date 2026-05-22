"use client";

import { RouteError } from "@/components/error/route-error";

export default function HistoryError({
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
      title="Couldn't load your history"
      description="We hit an error loading your sessions. Try again."
    />
  );
}
