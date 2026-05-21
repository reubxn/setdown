"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { Activity, Clock, Dumbbell, TrendingUp } from "lucide-react";
import { useDataset } from "@/context/dataset-context";
import { TabNav } from "@/components/legacy/tab-nav";
import { MetricCard, InsightCard } from "@/components/legacy/card";
import { StatRow } from "@/components/legacy/stat-row";
import { SectionLabel } from "@/components/legacy/section-label";
import { PageShell, ChartGrid } from "@/components/layout/page-shell";
import { ChartCard } from "@/components/charts/chart-card";
import {
  VolumeAreaChart,
  SessionBarChart,
  DurationLineChart,
  TopExercisesBarChart,
} from "@/components/charts/trend-chart";
import {
  volumeTimeSeries,
  sessionCountSeries,
  durationTimeSeries,
  topExercisesBarSeries,
  rangeSummaryStats,
} from "@/lib/chart-series";
import type { TimeRange } from "@/lib/time-range";
import { timeRangeLabel } from "@/lib/time-range";
import {
  overviewStats,
  formatVolume,
  formatDuration,
  detectPRs,
} from "@/lib/metrics";

function hasChartData(data: { value: number }[]) {
  return data.some((d) => d.value > 0);
}

function OverviewContent() {
  const { dataset } = useDataset();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") ?? "overview";
  const [range, setRange] = useState<TimeRange>("1m");

  const stats = useMemo(
    () => (dataset ? overviewStats(dataset) : null),
    [dataset]
  );
  const rangeStats = useMemo(
    () => (dataset ? rangeSummaryStats(dataset, range) : null),
    [dataset, range]
  );
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
  const topExercisesData = useMemo(
    () => (dataset ? topExercisesBarSeries(dataset, range, 8) : []),
    [dataset, range]
  );
  const prs = useMemo(
    () => (dataset ? detectPRs(dataset, 10) : []),
    [dataset]
  );
  const recentSessions = useMemo(
    () => dataset?.sessions.slice(0, 3) ?? [],
    [dataset]
  );

  if (!dataset || !stats || !rangeStats) return null;

  const trendDir =
    stats.volumeChangePercent > 2
      ? "up"
      : stats.volumeChangePercent < -2
        ? "down"
        : "neutral";
  const trendText =
    trendDir === "neutral"
      ? "—"
      : `${stats.volumeChangePercent > 0 ? "▲" : "▼"} ${Math.abs(Math.round(stats.volumeChangePercent))}%`;

  return (
    <PageShell
      title="Overview"
      subtitle={`${format(dataset.dateRange.start, "MMM yyyy")} — ${format(dataset.dateRange.end, "MMM yyyy")}`}
      className="!pt-4 lg:!pt-8"
    >
      <header className="mb-4 flex items-center justify-between lg:hidden">
        <div className="h-8 w-8 rounded-full bg-[var(--card)]" />
        <span className="text-xs font-medium tracking-[0.08em] text-[var(--text-muted)] uppercase">
          {format(dataset.dateRange.end, "MMM yyyy")}
        </span>
        <div className="h-2 w-2 rounded-full bg-[var(--accent-green)]" />
      </header>

      <TabNav />

      <div className="mt-4 space-y-4 lg:space-y-6">
        {tab === "overview" && (
          <>
            <MetricCard className="lg:p-6">
              <p className="mb-2 text-[10px] text-[var(--text-muted)] lg:text-xs">
                {timeRangeLabel(range)} · summary
              </p>
              <div className="lg:grid lg:grid-cols-2 lg:gap-x-8 xl:grid-cols-4 xl:gap-x-6">
              <StatRow
                icon={Activity}
                label="Sessions"
                value={String(rangeStats.sessionCount)}
              />
              <StatRow
                icon={TrendingUp}
                label="Volume"
                value={formatVolume(rangeStats.totalVolume)}
                trend={{ direction: trendDir, text: trendText }}
              />
              <StatRow
                icon={Clock}
                label="Avg duration"
                value={formatDuration(Math.round(rangeStats.avgDurationMinutes))}
              />
              <StatRow
                icon={Dumbbell}
                label="Top exercise"
                value={(() => {
                  const name = topExercisesData[0]?.date ?? stats.topExercise;
                  return name.length > 24 ? name.slice(0, 24) + "…" : name;
                })()}
              />
              </div>
            </MetricCard>

            <ChartGrid>
            <ChartCard
              title="Training volume"
              range={range}
              onRangeChange={setRange}
              hasData={hasChartData(volumeData)}
            >
              <VolumeAreaChart data={volumeData} chartId="overview-volume" />
            </ChartCard>

            <ChartCard
              title="Workout frequency"
              range={range}
              onRangeChange={setRange}
              hasData={hasChartData(sessionData)}
            >
              <SessionBarChart data={sessionData} />
            </ChartCard>

            <ChartCard
              title="Session duration"
              range={range}
              onRangeChange={setRange}
              hasData={hasChartData(durationData)}
            >
              <DurationLineChart data={durationData} />
            </ChartCard>
            </ChartGrid>

            <div className="lg:grid lg:grid-cols-2 lg:gap-6">
            <InsightCard>
              <SectionLabel className="mb-2">Insight</SectionLabel>
              <p className="text-sm text-white/80 leading-relaxed">
                {rangeStats.sessionCount} sessions {timeRangeLabel(range).toLowerCase()} with{" "}
                {formatVolume(rangeStats.totalVolume)} total volume.
                {stats.volumeChangePercent !== 0 &&
                  ` ${stats.volumeChangePercent > 0 ? "Up" : "Down"} ${Math.abs(Math.round(stats.volumeChangePercent))}% vs prior 4 weeks.`}
              </p>
            </InsightCard>

            <div>
              <SectionLabel className="mb-3 px-1">Recent sessions</SectionLabel>
              <div className="space-y-2 lg:grid lg:grid-cols-1 lg:gap-2 lg:space-y-0">
                {recentSessions.map((s) => (
                  <div
                    key={s.id}
                    className="rounded-2xl bg-[var(--card)] p-4"
                  >
                    <p className="font-medium capitalize">{s.workoutName}</p>
                    <p className="mt-1 text-xs text-[var(--text-muted)]">
                      {format(s.date, "MMM d, yyyy")} ·{" "}
                      {formatDuration(s.durationMinutes)} · {s.exerciseCount}{" "}
                      exercises
                    </p>
                  </div>
                ))}
              </div>
            </div>
            </div>
          </>
        )}

        {tab === "volume" && (
          <ChartGrid>
            <ChartCard
              title="Volume over time"
              range={range}
              onRangeChange={setRange}
              subtitle={`Total: ${formatVolume(rangeStats.totalVolume)}`}
              hasData={hasChartData(volumeData)}
            >
              <VolumeAreaChart data={volumeData} chartId="volume-tab" />
            </ChartCard>

            <ChartCard
              title="Sessions per period"
              range={range}
              onRangeChange={setRange}
              hasData={hasChartData(sessionData)}
            >
              <SessionBarChart data={sessionData} />
            </ChartCard>

            <ChartCard
              title="Top exercises by volume"
              range={range}
              onRangeChange={setRange}
              hasData={hasChartData(topExercisesData)}
            >
              <TopExercisesBarChart data={topExercisesData} />
            </ChartCard>

            <ChartCard
              title="Average session length"
              range={range}
              onRangeChange={setRange}
              hasData={hasChartData(durationData)}
            >
              <DurationLineChart data={durationData} />
            </ChartCard>
          </ChartGrid>
        )}

        {tab === "prs" && (
          <MetricCard title="Recent PRs" className="lg:max-w-4xl">
            <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
              {prs.length === 0 ? (
                <p className="text-sm text-[var(--text-muted)]">No PRs detected yet.</p>
              ) : (
                prs.map((pr, i) => (
                  <div
                    key={i}
                    className="flex justify-between gap-2 border-b border-white/5 pb-3 last:border-0"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{pr.exercise}</p>
                      <p className="text-xs text-[var(--text-muted)]">{pr.metric}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-[var(--accent-green)]">
                        {pr.value} kg
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {format(pr.date, "MMM d")}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </MetricCard>
        )}
      </div>
    </PageShell>
  );
}

export default function OverviewPage() {
  return (
    <Suspense fallback={<p className="p-8 text-center text-sm text-[var(--text-muted)]">Loading…</p>}>
      <OverviewContent />
    </Suspense>
  );
}
