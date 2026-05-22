"use client";

import { useMemo, useState } from "react";
import { Card, CardHeader } from "@/components/ui/card";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { VolumeAreaChart } from "@/components/charts/trend-chart";
import { volumeTimeSeries } from "@/lib/chart-series";
import { formatVolume } from "@/lib/metrics";
import type { TimeRange } from "@/lib/time-range";
import type { WorkoutDataset } from "@/lib/types";
import { usePreferences } from "@/context/preferences-context";

const RANGE_OPTIONS: { value: TimeRange; label: string }[] = [
  { value: "1w", label: "1W" },
  { value: "1m", label: "1M" },
  { value: "1y", label: "1Y" },
  { value: "max", label: "All" },
];

export function VolumeCard({ dataset }: { dataset: WorkoutDataset }) {
  const [range, setRange] = useState<TimeRange>("1m");
  const { prefs, weekStartsOn } = usePreferences();
  const data = useMemo(
    () => volumeTimeSeries(dataset, range, { weekStartsOn }),
    [dataset, range, weekStartsOn],
  );
  const total = useMemo(
    () => data.reduce((sum, p) => sum + p.value, 0),
    [data]
  );
  const hasData = data.some((d) => d.value > 0);

  return (
    <Card padding="lg" className="@container">
      <CardHeader
        title="Training volume"
        subtitle={hasData ? `${formatVolume(total)} ${prefs.units} total` : "No data in range"}
        action={
          <SegmentedControl
            size="sm"
            options={RANGE_OPTIONS}
            value={range}
            onChange={setRange}
            aria-label="Volume range"
          />
        }
      />
      {hasData ? (
        <div className="chart-surface w-full">
          <VolumeAreaChart data={data} chartId="overview-volume" />
        </div>
      ) : (
        <p className="py-10 text-center text-sm text-[var(--text-muted)]">
          No volume data for this range.
        </p>
      )}
    </Card>
  );
}
