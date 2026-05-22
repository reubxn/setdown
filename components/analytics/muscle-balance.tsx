// <MuscleBalance dataset={dataset} />
"use client";

import { AlertTriangle, Info } from "lucide-react";
import type { WorkoutDataset } from "@/lib/types";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { formatVolume } from "@/lib/metrics";
import {
  BUCKET_LABELS,
  computeMuscleBalance,
  type BalanceWarning,
} from "@/lib/derive/muscle-balance";
import { usePreferences } from "@/context/preferences-context";

function WarningRow({ w }: { w: BalanceWarning }) {
  const Icon = w.severity === "warn" ? AlertTriangle : Info;
  const tone =
    w.severity === "warn"
      ? "text-[var(--warn)]"
      : "text-[var(--text-muted)]";
  return (
    <div className="flex items-start gap-2 text-xs">
      <Icon className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${tone}`} aria-hidden />
      <span className="text-[var(--text-secondary)]">{w.message}</span>
    </div>
  );
}

export function MuscleBalance({
  dataset,
  windowWeeks = 8,
}: {
  dataset: WorkoutDataset;
  windowWeeks?: number;
}) {
  const balance = computeMuscleBalance(dataset, windowWeeks);
  const max = Math.max(...balance.buckets.map((b) => b.volume), 1);
  const { prefs } = usePreferences();

  if (balance.totalVolume === 0) {
    return (
      <Card>
        <CardHeader title="Muscle balance" />
        <CardBody>
          <p className="text-sm text-[var(--text-muted)]">
            No working sets in the last {windowWeeks} weeks.
          </p>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        title="Muscle balance"
        subtitle={`Volume distribution, last ${windowWeeks} weeks`}
      />
      <CardBody>
        <ul className="flex flex-col gap-2.5">
          {balance.buckets.map((b) => (
            <li key={b.bucket} className="flex flex-col gap-1">
              <div className="flex items-baseline justify-between gap-2 text-xs">
                <span className="text-[var(--text-secondary)] font-medium">
                  {BUCKET_LABELS[b.bucket]}
                </span>
                <span className="text-[var(--text-muted)] tabular-nums">
                  {formatVolume(b.volume)} {prefs.units}·reps · {b.percent.toFixed(0)}%
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--bg-sunken)]">
                <div
                  className="h-full rounded-full bg-[var(--accent)] transition-all"
                  style={{ width: `${(b.volume / max) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>

        {balance.warnings.length > 0 ? (
          <div className="mt-4 flex flex-col gap-1.5 border-t border-[var(--border-subtle)] pt-3">
            {balance.warnings.map((w, i) => (
              <WarningRow key={i} w={w} />
            ))}
          </div>
        ) : null}
      </CardBody>
    </Card>
  );
}
