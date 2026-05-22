"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { useDataset } from "@/context/dataset-context";
import { useAuth } from "@/context/auth-context";
import { MuscleBalance } from "@/components/analytics/muscle-balance";
import { BodyHeatmap } from "@/components/analytics/body-heatmap";
import { StreakCard } from "@/components/analytics/streak-card";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";

export default function InsightsPage() {
  const { dataset, loading } = useDataset();
  const { isAuthenticated } = useAuth();

  return (
    <div className="@container mx-auto w-full max-w-6xl px-4 py-6">
      <header className="mb-6 flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
          Insights
        </h1>
        <p className="text-sm text-[var(--text-muted)]">
          Muscle balance, training streaks, and AI commentary on your data.
        </p>
      </header>

      {loading ? (
        <p className="text-sm text-[var(--text-muted)]">Loading…</p>
      ) : !dataset ? (
        <EmptyState
          icon={Sparkles}
          title="No insights yet"
          description="Upload a workout to generate insights about muscle balance, streaks, and trends."
          action={
            <Link href="/overview">
              <Button variant="primary">Get started</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 @lg:grid-cols-2">
          <BodyHeatmap dataset={dataset} />
          <MuscleBalance dataset={dataset} />
          <StreakCard dataset={dataset} />
          <Card className="@lg:col-span-2">
            <CardHeader
              title={
                <span className="flex items-center gap-2">
                  <Sparkles
                    className="h-4 w-4 text-[var(--accent)]"
                    aria-hidden
                  />
                  AI commentary
                </span>
              }
              action={
                !isAuthenticated ? (
                  <Badge variant="muted">Sign in required</Badge>
                ) : null
              }
            />
            <CardBody>
              <p className="text-sm text-[var(--text-secondary)]">
                {isAuthenticated
                  ? "AI insights will appear here once they finish generating."
                  : "Sign in to get AI-generated commentary on your training. We'll summarize trends, flag plateaus, and suggest tweaks — all from your data."}
              </p>
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
}
