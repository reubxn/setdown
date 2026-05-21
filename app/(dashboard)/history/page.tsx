"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { useDataset } from "@/context/dataset-context";
import { formatDuration, formatVolume } from "@/lib/metrics";
import { PageShell, ChartGrid } from "@/components/layout/page-shell";
import { ChartCard } from "@/components/charts/chart-card";
import {
  VolumeAreaChart,
  SessionBarChart,
  DurationLineChart,
} from "@/components/charts/trend-chart";
import {
  volumeTimeSeries,
  sessionCountSeries,
  durationTimeSeries,
  rangeSummaryStats,
} from "@/lib/chart-series";
import type { TimeRange } from "@/lib/time-range";
import { sessionsInRange } from "@/lib/metrics";
import { getRangeBounds } from "@/lib/time-range";

function hasChartData(data: { value: number }[]) {
  return data.some((d) => d.value > 0);
}

export default function HistoryPage() {
  const { dataset } = useDataset();
  const [range, setRange] = useState<TimeRange>("1y");

  const volumeData = useMemo(
    () => (dataset ? volumeTimeSeries(dataset, range) : []),
    [dataset, range]
  );
  const sessionData = useMemo(
    () => (dataset ? sessionCountSeries(dataset, range) : []),
    [dataset, range]
  );
  const durationData = useMemo(
    () => (dataset ? durationTimeSeries(dataset, range) : []),
    [dataset, range]
  );
  const rangeStats = useMemo(
    () => (dataset ? rangeSummaryStats(dataset, range) : null),
    [dataset, range]
  );

  const filteredSessions = useMemo(() => {
    if (!dataset) return [];
    const { start, end } = getRangeBounds(dataset, range);
    return sessionsInRange(dataset.sessions, start, end);
  }, [dataset, range]);

  if (!dataset) return null;

  return (
    <PageShell
      title="History"
      subtitle={`${dataset.sessions.length} sessions total${rangeStats ? ` · ${rangeStats.sessionCount} in range` : ""}`}
    >
      <ChartGrid className="mb-8">
        <ChartCard
          title="Volume over time"
          range={range}
          onRangeChange={setRange}
          subtitle={
            rangeStats
              ? `Total: ${formatVolume(rangeStats.totalVolume)}`
              : undefined
          }
          hasData={hasChartData(volumeData)}
        >
          <VolumeAreaChart data={volumeData} chartId="history-volume" />
        </ChartCard>

        <ChartCard
          title="Sessions"
          range={range}
          onRangeChange={setRange}
          hasData={hasChartData(sessionData)}
        >
          <SessionBarChart data={sessionData} />
        </ChartCard>

        <ChartCard
          title="Avg duration"
          range={range}
          onRangeChange={setRange}
          subtitle={
            rangeStats
              ? `Avg ${formatDuration(Math.round(rangeStats.avgDurationMinutes))}`
              : undefined
          }
          hasData={hasChartData(durationData)}
        >
          <DurationLineChart data={durationData} />
        </ChartCard>
      </ChartGrid>

      <p className="mb-3 text-xs font-medium tracking-[0.08em] text-[var(--text-muted)] uppercase">
        Sessions
      </p>

      <ul className="grid grid-cols-1 gap-2 lg:grid-cols-2 xl:grid-cols-3">
        {filteredSessions.map((session) => (
          <li key={session.id}>
            <Link
              href={`/history/${encodeURIComponent(session.id)}`}
              className="block rounded-2xl bg-[var(--card)] p-4 hover:bg-[var(--card-alt)] transition-colors"
            >
              <div className="flex justify-between items-start gap-2">
                <div>
                  <p className="font-medium capitalize">{session.workoutName}</p>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    {format(session.date, "EEE, MMM d, yyyy")}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-[var(--text-muted)]">
                    {formatDuration(session.durationMinutes)}
                  </p>
                  <p className="text-xs text-[var(--accent-blue)] mt-0.5">
                    {formatVolume(session.totalVolume)}
                  </p>
                </div>
              </div>
              <p className="mt-2 text-xs text-[var(--text-muted)]">
                {session.exerciseCount} exercises · {session.sets.length} sets
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </PageShell>
  );
}
