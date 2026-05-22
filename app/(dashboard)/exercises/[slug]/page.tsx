"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Dumbbell, SearchX } from "lucide-react";
import { useDataset } from "@/context/dataset-context";
import { exerciseFromSlug } from "@/lib/parse-strong-csv";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { ExerciseDetailHeader } from "@/components/exercises/exercise-detail-header";
import {
  OneRMChart,
  type OneRMSeries,
} from "@/components/exercises/one-rm-chart";
import { SetHistoryTable } from "@/components/exercises/set-history-table";
import {
  exerciseOneRMSeries,
  maxOneRM,
} from "@/lib/derive/one-rm";
import { exerciseProgressSeries } from "@/lib/chart-series";
import { ExerciseLineChart } from "@/components/charts/trend-chart";
import { ExerciseDetailSkeleton } from "@/components/loading/page-skeletons";
import { BodyHeatmap } from "@/components/analytics/body-heatmap";

const COMPARE_COLOR = "#FFD60A";
const PRIMARY_COLOR = "var(--accent)";

export default function ExerciseDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { dataset, loading } = useDataset();
  const [compare, setCompare] = useState<string>("");

  const exerciseName = useMemo(() => {
    if (!dataset || !slug) return null;
    return exerciseFromSlug(slug, dataset.exercises);
  }, [dataset, slug]);

  const oneRMPoints = useMemo(() => {
    if (!dataset || !exerciseName) return [];
    return exerciseOneRMSeries(dataset, exerciseName);
  }, [dataset, exerciseName]);

  const comparePoints = useMemo(() => {
    if (!dataset || !compare) return [];
    return exerciseOneRMSeries(dataset, compare);
  }, [dataset, compare]);

  const pr = useMemo(() => {
    if (!dataset || !exerciseName) return null;
    return maxOneRM(dataset, exerciseName);
  }, [dataset, exerciseName]);

  const allSets = useMemo(() => {
    if (!dataset || !exerciseName) return [];
    const sets = [];
    for (const session of dataset.sessions) {
      for (const set of session.sets) {
        if (set.exerciseName === exerciseName) sets.push(set);
      }
    }
    return sets;
  }, [dataset, exerciseName]);

  const lastPerformed = useMemo(() => {
    if (allSets.length === 0) return null;
    return allSets.reduce(
      (max, s) => (s.date > max ? s.date : max),
      allSets[0].date,
    );
  }, [allSets]);

  const maxWeight = useMemo(
    () =>
      allSets.reduce(
        (m, s) => (s.setType !== "warmup" && s.weight > m ? s.weight : m),
        0,
      ),
    [allSets],
  );

  const volumeChartData = useMemo(() => {
    if (!dataset || !exerciseName) return [];
    return exerciseProgressSeries(dataset, exerciseName, "max");
  }, [dataset, exerciseName]);

  if (loading) {
    return <ExerciseDetailSkeleton />;
  }

  if (!dataset) {
    return (
      <PageShell title="Exercise">
        <EmptyState
          icon={Dumbbell}
          title="No data yet"
          description="Upload your Strong export to see this exercise."
          action={
            <Link href="/overview">
              <Button variant="primary">Get started</Button>
            </Link>
          }
        />
      </PageShell>
    );
  }

  if (!exerciseName) {
    return (
      <PageShell title="Exercise not found">
        <EmptyState
          icon={SearchX}
          title="Exercise not found"
          description="We couldn't find that exercise in your dataset."
          action={
            <Link href="/exercises">
              <Button variant="secondary">Back to exercises</Button>
            </Link>
          }
        />
      </PageShell>
    );
  }

  if (allSets.length === 0) {
    return (
      <PageShell title={exerciseName}>
        <EmptyState
          icon={Dumbbell}
          title="No sets recorded for this exercise"
          description="Once you log a session containing this exercise, your 1RM curve and history will appear here."
          action={
            <Link href="/exercises">
              <Button variant="secondary">Back to exercises</Button>
            </Link>
          }
        />
      </PageShell>
    );
  }

  const series: OneRMSeries[] = [
    { name: exerciseName, color: PRIMARY_COLOR, points: oneRMPoints },
  ];
  if (compare && comparePoints.length > 0) {
    series.push({ name: compare, color: COMPARE_COLOR, points: comparePoints });
  }

  const otherExercises = dataset.exercises.filter((e) => e !== exerciseName);

  return (
    <PageShell className="pb-8">
      <ExerciseDetailHeader
        name={exerciseName}
        lastPerformed={lastPerformed}
        pr={pr}
        maxWeight={maxWeight}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
        <Card padding="md" className="lg:col-span-2">
          <CardHeader
            title="Estimated 1RM"
            subtitle="Epley · best working set per session"
            action={
              <div className="flex items-center gap-2">
                <label
                  htmlFor="compare-select"
                  className="text-[11px] uppercase tracking-wide text-[var(--text-muted)]"
                >
                  Compare
                </label>
                <select
                  id="compare-select"
                  value={compare}
                  onChange={(e) => setCompare(e.target.value)}
                  className="rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--bg-sunken)] px-2 py-1 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                >
                  <option value="">None</option>
                  {otherExercises.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
            }
          />
          <CardBody>
            <OneRMChart series={series} height={320} />
          </CardBody>
        </Card>

        <Card padding="md">
          <CardHeader title="Volume per session" subtitle="kg · reps" />
          <CardBody>
            {volumeChartData.length > 0 ? (
              <div className="h-64">
                <ExerciseLineChart
                  data={volumeChartData}
                  dataKey="volume"
                  label="kg·reps"
                  color="#00C2FF"
                />
              </div>
            ) : (
              <p className="text-sm text-[var(--text-muted)]">
                No volume yet.
              </p>
            )}
          </CardBody>
        </Card>

        <Card padding="md">
          <CardHeader
            title="Max weight per session"
            subtitle="Heaviest working set"
          />
          <CardBody>
            {volumeChartData.length > 0 ? (
              <div className="h-64">
                <ExerciseLineChart
                  data={volumeChartData}
                  dataKey="maxWeight"
                  label="kg"
                />
              </div>
            ) : (
              <p className="text-sm text-[var(--text-muted)]">
                No sets yet.
              </p>
            )}
          </CardBody>
        </Card>

        <div className="lg:col-span-2">
          <BodyHeatmap
            exerciseNames={[exerciseName]}
            title="Targeted muscles"
            subtitle="Primary in solid, secondary lighter"
          />
        </div>
      </div>

      <div className="mt-6">
        <h2 className="mb-3 text-sm font-medium text-[var(--text-primary)]">
          Set history
        </h2>
        <SetHistoryTable sets={allSets} />
      </div>
    </PageShell>
  );
}
