"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { format, isWithinInterval, startOfMonth, endOfMonth } from "date-fns";
import { BarChart3 } from "lucide-react";
import { useDataset } from "@/context/dataset-context";
import { useAuth } from "@/context/auth-context";
import { PageShell } from "@/components/layout/page-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { Dropzone } from "@/components/upload/dropzone";
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
import { uploadCsvFile } from "@/lib/upload-orchestrator";
import { parseStrongCsv } from "@/lib/parse-strong-csv";

function OverviewEmptyState() {
  const { setDataset } = useDataset();
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onFile = useCallback(
    async (file: File) => {
      setError(null);
      setBusy(true);
      try {
        if (isAuthenticated) {
          const { dataset } = await uploadCsvFile(file, {
            isAuthenticated: true,
          });
          await setDataset(dataset);
        } else {
          const text = await file.text();
          const result = parseStrongCsv(text, file.name);
          if ("error" in result) {
            setError(result.error);
            return;
          }
          await setDataset(result.dataset);
        }
        router.push("/overview");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Upload failed.");
      } finally {
        setBusy(false);
      }
    },
    [isAuthenticated, router, setDataset],
  );

  return (
    <PageShell title="Overview">
      <EmptyState
        icon={BarChart3}
        title="No data yet"
        description="Drop your Strong export to see volume, frequency, and PRs."
      >
        <Dropzone size="md" onFileSelected={onFile} disabled={busy} />
        {error ? (
          <p className="mt-3 text-sm text-[var(--danger)]">{error}</p>
        ) : null}
      </EmptyState>
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
  if (!dataset || !kpis) return <OverviewEmptyState />;

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
