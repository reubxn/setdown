"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useDataset } from "@/context/dataset-context";
import { exerciseFromSlug } from "@/lib/parse-strong-csv";
import { exerciseStats } from "@/lib/metrics";
import { PageShell, ChartGrid } from "@/components/layout/page-shell";
import { ChartCard } from "@/components/charts/chart-card";
import { ExerciseLineChart, exerciseFit } from "@/components/charts/trend-chart";
import { exerciseProgressSeries } from "@/lib/chart-series";
import { formatSlopePerMonth } from "@/lib/regression";
import { getRangeBounds, type TimeRange } from "@/lib/time-range";
import { format } from "date-fns";

export default function ExerciseDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { dataset } = useDataset();
  const [range, setRange] = useState<TimeRange>("max");

  const exerciseName = useMemo(() => {
    if (!dataset || !slug) return null;
    return exerciseFromSlug(slug, dataset.exercises);
  }, [dataset, slug]);

  const progressData = useMemo(() => {
    if (!dataset || !exerciseName) return [];
    return exerciseProgressSeries(dataset, exerciseName, range);
  }, [dataset, exerciseName, range]);

  const stats = useMemo(() => {
    if (!dataset || !exerciseName) return null;
    const { start } = getRangeBounds(dataset, range);
    return exerciseStats(dataset, exerciseName, start);
  }, [dataset, exerciseName, range]);

  const setsBySession = useMemo(() => {
    if (!stats) return [];
    const { start } = dataset
      ? getRangeBounds(dataset, range)
      : { start: new Date(0) };
    const sets = stats.sets.filter((s) => s.date >= start);
    const map = new Map<string, typeof sets>();
    for (const set of sets) {
      const key = format(set.date, "yyyy-MM-dd") + " · " + set.workoutName;
      const arr = map.get(key) ?? [];
      arr.push(set);
      map.set(key, arr);
    }
    return [...map.entries()].reverse().slice(0, 12);
  }, [stats, dataset, range]);

  const hasChartData = progressData.length > 0;

  const maxWeightSubtitle = useMemo(() => {
    const fit = exerciseFit(progressData, "maxWeight");
    return fit ? formatSlopePerMonth(fit, "kg") ?? undefined : undefined;
  }, [progressData]);
  const volumeSubtitle = useMemo(() => {
    const fit = exerciseFit(progressData, "volume");
    return fit ? formatSlopePerMonth(fit, "kg·reps") ?? undefined : undefined;
  }, [progressData]);
  const oneRmSubtitle = useMemo(() => {
    const fit = exerciseFit(progressData, "est1RM");
    return fit ? formatSlopePerMonth(fit, "kg") ?? undefined : undefined;
  }, [progressData]);

  if (!dataset || !exerciseName || !stats) {
    return (
      <div className="px-4 py-8">
        <p className="text-[var(--text-muted)]">Exercise not found.</p>
        <Link href="/exercises" className="mt-4 text-sm text-[var(--accent-blue)]">
          ← Back to exercises
        </Link>
      </div>
    );
  }

  const { maxWeight, max1RM } = stats;
  const rangeMaxWeight = Math.max(0, ...progressData.map((p) => p.maxWeight));
  const rangeMax1RM = Math.max(0, ...progressData.map((p) => p.est1RM));

  return (
    <PageShell
      title={exerciseName}
      className="pb-8"
      headerExtra={
        <Link
          href="/exercises"
          className="inline-flex items-center gap-1 text-sm text-[var(--accent-blue)]"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
          All exercises
        </Link>
      }
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:max-w-4xl">
        <div className="rounded-2xl bg-[var(--card)] p-4">
          <p className="text-xs tracking-[0.08em] text-[var(--text-muted)] uppercase">
            Max weight
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums">
            {(rangeMaxWeight || maxWeight) > 0
              ? `${rangeMaxWeight || maxWeight} kg`
              : "—"}
          </p>
        </div>
        <div className="rounded-2xl bg-[var(--card)] p-4">
          <p className="text-xs tracking-[0.08em] text-[var(--text-muted)] uppercase">
            Est. 1RM
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-[var(--accent-green)]">
            {(rangeMax1RM || max1RM) > 0
              ? `${Math.round(rangeMax1RM || max1RM)} kg`
              : "—"}
          </p>
          <p className="text-[10px] text-[var(--text-muted)]">Epley · per range</p>
        </div>
      </div>

      <ChartGrid className="mt-6">
      <ChartCard
        title="Max weight per session"
        range={range}
        onRangeChange={setRange}
        hasData={hasChartData}
        subtitle={maxWeightSubtitle}
      >
        <ExerciseLineChart
          data={progressData}
          dataKey="maxWeight"
          label="kg"
        />
      </ChartCard>

      <ChartCard
        title="Volume per session"
        range={range}
        onRangeChange={setRange}
        hasData={hasChartData}
        subtitle={volumeSubtitle}
      >
        <ExerciseLineChart
          data={progressData}
          dataKey="volume"
          label="kg·reps"
          color="#00FF9D"
        />
      </ChartCard>

      <ChartCard
        title="Estimated 1RM"
        range={range}
        onRangeChange={setRange}
        className="lg:col-span-2"
        hasData={hasChartData}
        subtitle={oneRmSubtitle}
      >
        <ExerciseLineChart
          data={progressData}
          dataKey="est1RM"
          label="kg"
          color="#FFD60A"
        />
      </ChartCard>
      </ChartGrid>

      {setsBySession.length > 0 && (
        <div className="mt-6 rounded-2xl bg-[var(--card)] p-4 lg:p-6">
          <p className="text-xs font-medium tracking-[0.08em] text-[var(--text-muted)] uppercase mb-3">
            Set history
          </p>
          <div className="space-y-4 lg:grid lg:grid-cols-2 lg:gap-6 lg:space-y-0">
            {setsBySession.map(([session, sessionSets]) => (
              <div key={session}>
                <p className="text-xs text-[var(--text-muted)] mb-2">{session}</p>
                <div className="flex flex-wrap gap-2">
                  {sessionSets.map((s) => (
                    <span
                      key={s.id}
                      className="rounded-lg bg-[var(--bg-secondary)] px-2 py-1 text-xs tabular-nums"
                    >
                      {s.weight}×{s.reps}
                      {s.setType === "dropset" && " D"}
                      {s.setType === "failure" && " F"}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </PageShell>
  );
}
