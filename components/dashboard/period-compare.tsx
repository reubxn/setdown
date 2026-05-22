"use client";

import { useMemo, useState } from "react";
import { Card, CardHeader } from "@/components/ui/card";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Metric, type MetricDelta } from "@/components/ui/metric";
import {
  comparePeriodLabel,
  periodCompare,
  type ComparePeriod,
} from "@/lib/derive/period-compare";
import { formatDuration, formatVolume } from "@/lib/metrics";
import type { WorkoutDataset } from "@/lib/types";

const PERIOD_OPTIONS: { value: ComparePeriod; label: string }[] = [
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "quarter", label: "Quarter" },
  { value: "year", label: "Year" },
];

function formatPercent(p: number): string {
  if (!Number.isFinite(p)) return "—";
  const rounded = Math.round(p);
  if (rounded === 0) return "0%";
  return `${rounded > 0 ? "+" : ""}${rounded}%`;
}

function deltaFor(percent: number): MetricDelta {
  const rounded = Math.round(percent);
  const direction = rounded > 0 ? "up" : rounded < 0 ? "down" : "flat";
  return {
    value: formatPercent(percent),
    direction,
  };
}

export function PeriodCompareCard({ dataset }: { dataset: WorkoutDataset }) {
  const [period, setPeriod] = useState<ComparePeriod>("month");
  const compare = useMemo(() => periodCompare(dataset, period), [dataset, period]);
  const labels = comparePeriodLabel(period);

  return (
    <Card padding="lg" className="@container">
      <CardHeader
        title="Period compare"
        subtitle={`${labels.current} vs ${labels.previous}`}
        action={
          <SegmentedControl
            size="sm"
            options={PERIOD_OPTIONS}
            value={period}
            onChange={setPeriod}
            aria-label="Compare period"
          />
        }
      />
      <div className="grid grid-cols-2 gap-x-6 gap-y-5 @md:grid-cols-4">
        <Metric
          label="Sessions"
          value={compare.current.sessionCount.toLocaleString()}
          delta={deltaFor(compare.delta.sessionsPercent)}
          hint={`vs ${compare.previous.sessionCount}`}
        />
        <Metric
          label="Volume"
          value={formatVolume(compare.current.totalVolume)}
          unit="kg"
          delta={deltaFor(compare.delta.volumePercent)}
          hint={`vs ${formatVolume(compare.previous.totalVolume)}`}
        />
        <Metric
          label="Sets"
          value={compare.current.totalSets.toLocaleString()}
          delta={deltaFor(compare.delta.setsPercent)}
          hint={`vs ${compare.previous.totalSets}`}
        />
        <Metric
          label="Avg duration"
          value={formatDuration(Math.round(compare.current.avgDurationMinutes))}
          delta={deltaFor(compare.delta.durationPercent)}
          hint={`vs ${formatDuration(Math.round(compare.previous.avgDurationMinutes))}`}
        />
      </div>
    </Card>
  );
}
