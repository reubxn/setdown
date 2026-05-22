"use client";

import { RouteError } from "@/components/error/route-error";

export default function SessionDetailError({
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
      title="Couldn't load this session"
      description="Something went wrong opening this workout. Try again."
    />
  );
}
