"use client";

import Link from "next/link";
import { formatDistanceToNowStrict } from "date-fns";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatVolume } from "@/lib/metrics";
import { slugifyExercise } from "@/lib/parse-strong-csv";
import type { Bucket } from "@/lib/derive/muscle-mapping";

export interface ExerciseRow {
  name: string;
  bucket: Bucket;
  maxWeight: number;
  volume30d: number;
  lastPerformed: Date | null;
  sparkline: number[];
}

const BUCKET_LABEL: Record<Bucket, string> = {
  push: "Push",
  pull: "Pull",
  legs: "Legs",
  core: "Core",
  arms: "Arms",
  other: "Other",
};

function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) {
    return <div className="h-7 w-20 shrink-0" aria-hidden />;
  }
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const w = 80;
  const h = 28;
  const step = w / (values.length - 1);
  const points = values
    .map((v, i) => `${i * step},${h - ((v - min) / range) * h}`)
    .join(" ");
  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      className="shrink-0 overflow-visible"
      aria-hidden
    >
      <polyline
        points={points}
        fill="none"
        stroke="var(--accent)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ExerciseCard({ row }: { row: ExerciseRow }) {
  const lastLabel = row.lastPerformed
    ? formatDistanceToNowStrict(row.lastPerformed, { addSuffix: true })
    : "Never";

  return (
    <Link href={`/exercises/${slugifyExercise(row.name)}`} className="block">
      <Card interactive padding="md" className="h-full">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-medium text-[var(--text-primary)]">
              {row.name}
            </h3>
            <div className="mt-1 flex items-center gap-2">
              <Badge variant="muted">{BUCKET_LABEL[row.bucket]}</Badge>
              <span className="text-xs text-[var(--text-muted)]">
                {lastLabel}
              </span>
            </div>
          </div>
          <Sparkline values={row.sparkline} />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
          <div>
            <div className="text-[var(--text-muted)]">Max</div>
            <div className="mt-0.5 font-medium tabular-nums text-[var(--text-primary)]">
              {row.maxWeight > 0 ? `${row.maxWeight} kg` : "—"}
            </div>
          </div>
          <div>
            <div className="text-[var(--text-muted)]">Vol · 30d</div>
            <div className="mt-0.5 font-medium tabular-nums text-[var(--text-primary)]">
              {row.volume30d > 0 ? formatVolume(row.volume30d) : "—"}
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
