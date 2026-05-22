"use client";

import { RouteError } from "@/components/error/route-error";

export default function BodyError({
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
      title="Couldn't load your measurements"
      description="Something went wrong loading your body log. Try again."
    />
  );
}
