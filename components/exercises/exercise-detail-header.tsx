"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { formatDistanceToNowStrict } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { bucketOf } from "@/lib/derive/muscle-mapping";
import type { OneRMPoint } from "@/lib/derive/one-rm";

export interface DetailHeaderProps {
  name: string;
  lastPerformed: Date | null;
  pr: OneRMPoint | null;
  maxWeight: number;
}

const BUCKET_LABEL: Record<string, string> = {
  push: "Push",
  pull: "Pull",
  legs: "Legs",
  core: "Core",
  arms: "Arms",
  other: "Other",
};

export function ExerciseDetailHeader({
  name,
  lastPerformed,
  pr,
  maxWeight,
}: DetailHeaderProps) {
  const bucket = bucketOf(name);
  const lastLabel = lastPerformed
    ? formatDistanceToNowStrict(lastPerformed, { addSuffix: true })
    : "Never performed";

  return (
    <header className="mb-6 flex flex-col gap-3">
      <Link
        href="/exercises"
        className="inline-flex w-fit items-center gap-1 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.5} />
        All exercises
      </Link>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">
            {name}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant="muted">{BUCKET_LABEL[bucket] ?? bucket}</Badge>
            <span className="text-xs text-[var(--text-muted)]">
              Last performed {lastLabel}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {maxWeight > 0 && (
            <div className="text-right">
              <p className="text-[11px] uppercase tracking-wide text-[var(--text-muted)]">
                Max weight
              </p>
              <p className="text-xl font-semibold tabular-nums text-[var(--text-primary)]">
                {maxWeight} kg
              </p>
            </div>
          )}
          {pr && (
            <div className="text-right">
              <p className="text-[11px] uppercase tracking-wide text-[var(--text-muted)]">
                Est. 1RM
              </p>
              <p className="text-xl font-semibold tabular-nums text-[var(--accent)]">
                {Math.round(pr.est1RM)} kg
              </p>
              <p className="text-[10px] text-[var(--text-muted)]">
                {pr.weight}×{pr.reps} · Epley
              </p>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
