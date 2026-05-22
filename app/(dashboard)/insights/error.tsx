"use client";

import { RouteError } from "@/components/error/route-error";

export default function InsightsError({
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
      title="Couldn't load insights"
      description="We hit a snag generating your insights. Try again."
    />
  );
}
