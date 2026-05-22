"use client";

import { useMemo } from "react";
import { format, isWithinInterval, startOfMonth, endOfMonth } from "date-fns";
import Link from "next/link";
import { Upload } from "lucide-react";
import { useDataset } from "@/context/dataset-context";
import { PageShell } from "@/components/layout/page-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { KpiRow, type KpiItem } from "@/components/dashboard/kpi-row";
import { VolumeCard } from "@/components/dashboard/volume-card";
import { FrequencyCalendar } from "@/components/dashboard/frequency-calendar";
import { RecentPRs } from "@/components/dashboard/recent-prs";
import { TopExercises } from "@/components/dashboard/top-exercises";
import { PeriodCompareCard } from "@/components/dashboard/period-compare";
import {
  detectPRs,
  formatVolume,
  overviewStats,
} from "@/lib/metrics";
import { computeStreaks } from "@/lib/derive/streaks";

function EmptyState() {
  return (
    <PageShell title="Overview">
      <Card padding="lg" className="mx-auto max-w-xl text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--bg-sunken)] text-[var(--accent)]">
          <Upload className="h-5 w-5" aria-hidden />
        </div>
        <h2 className="mt-4 text-lg font-semibold text-[var(--text-primary)]">
          No workouts yet
        </h2>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Drop your Strong export to see volume, frequency, and PRs.
        </p>
        <div className="mt-5">
          <Link href="/upload">
            <Button variant="primary">Upload CSV</Button>
          </Link>
        </div>
      </Card>
    </PageShell>
  );
}

function OverviewLoading() {
  return (
    <PageShell title="Overview">
      <p className="p-8 text-center text-sm text-[var(--text-muted)]">
        Loading…
      </p>
    </PageShell>
  );
}

export default function OverviewPage() {
  const { dataset, loading } = useDataset();

  const kpis = useMemo<KpiItem[] | null>(() => {
    if (!dataset) return null;
    const stats = overviewStats(dataset);
    const streaks = computeStreaks(dataset);

    const monthStart = startOfMonth(dataset.dateRange.end);
    const monthEnd = endOfMonth(dataset.dateRange.end);
    const prsThisMonth = detectPRs(dataset, 500).filter((pr) =>
      isWithinInterval(pr.date, { start: monthStart, end: monthEnd })
    ).length;

    const volumeDirection =
      stats.volumeChangePercent > 2
        ? "up"
        : stats.volumeChangePercent < -2
          ? "down"
          : "flat";

    return [
      {
        label: "Sessions (4w)",
        value: stats.sessionsLast4Weeks.toLocaleString(),
        hint: `${stats.workoutsPerWeekAvg.toFixed(1)}/wk avg`,
      },
      {
        label: "Volume (4w)",
        value: formatVolume(stats.volumeLast4Weeks),
        unit: "kg",
        delta:
          stats.volumePrior4Weeks > 0
            ? {
                value: `${stats.volumeChangePercent > 0 ? "+" : ""}${Math.round(stats.volumeChangePercent)}%`,
                direction: volumeDirection,
              }
            : undefined,
      },
      {
        label: "Current streak",
        value: streaks.currentWeeks.toLocaleString(),
        unit: streaks.currentWeeks === 1 ? "week" : "weeks",
        hint:
          streaks.longestWeeks > 0
            ? `best ${streaks.longestWeeks}`
            : undefined,
      },
      {
        label: "PRs this month",
        value: prsThisMonth.toLocaleString(),
        hint: format(dataset.dateRange.end, "MMM yyyy"),
      },
    ];
  }, [dataset]);

  if (loading) return <OverviewLoading />;
  if (!dataset || !kpis) return <EmptyState />;

  return (
    <PageShell
      title="Overview"
      subtitle={`${format(dataset.dateRange.start, "MMM yyyy")} — ${format(dataset.dateRange.end, "MMM yyyy")}`}
    >
      <div className="space-y-4 lg:space-y-6">
        <KpiRow items={kpis} />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
          <VolumeCard dataset={dataset} />
          <FrequencyCalendar dataset={dataset} />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
          <RecentPRs dataset={dataset} />
          <TopExercises dataset={dataset} />
        </div>

        <PeriodCompareCard dataset={dataset} />
      </div>
    </PageShell>
  );
}
