// Friendly error boundary surface for app/.../error.tsx files.
"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export interface RouteErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
  title?: string;
  description?: string;
}

export function RouteError({
  error,
  reset,
  title = "Something went wrong",
  description = "We hit an unexpected error rendering this page. Try again, or head back to the dashboard.",
}: RouteErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-12">
      <Card padding="lg" className="text-center">
        <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[var(--danger)]/10 text-[var(--danger)]">
          <AlertTriangle className="h-6 w-6" strokeWidth={1.5} aria-hidden />
        </div>
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">
          {title}
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-[var(--text-secondary)]">
          {description}
        </p>
        {error.digest ? (
          <p className="mt-3 font-mono text-[11px] text-[var(--text-muted)]">
            ref {error.digest}
          </p>
        ) : null}
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <Button onClick={reset} leftIcon={<RefreshCw className="h-4 w-4" />}>
            Try again
          </Button>
        </div>
      </Card>
    </div>
  );
}
