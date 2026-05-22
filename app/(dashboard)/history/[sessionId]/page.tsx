"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CalendarDays, SearchX } from "lucide-react";
import { useDataset } from "@/context/dataset-context";
import { PageShell } from "@/components/layout/page-shell";
import { SessionDetail } from "@/components/history/session-detail";
import { BodyHeatmap } from "@/components/analytics/body-heatmap";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";

export default function SessionDetailPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { dataset } = useDataset();

  const session = useMemo(() => {
    if (!dataset || !sessionId) return null;
    const decoded = decodeURIComponent(sessionId);
    return dataset.sessions.find((s) => s.id === decoded) ?? null;
  }, [dataset, sessionId]);

  if (!dataset) {
    return (
      <PageShell title="Session">
        <EmptyState
          icon={CalendarDays}
          title="No data yet"
          description="Upload your Strong export to view session details."
          action={
            <Link href="/overview">
              <Button variant="primary">Get started</Button>
            </Link>
          }
        />
      </PageShell>
    );
  }

  if (!session) {
    return (
      <PageShell
        title="Session not found"
        headerExtra={
          <Link
            href="/history"
            className="inline-flex items-center gap-1 text-sm text-[var(--accent)] hover:underline"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
            History
          </Link>
        }
      >
        <EmptyState
          icon={SearchX}
          title="Session not found"
          description="We couldn't find that session in your dataset."
          action={
            <Link href="/history">
              <Button variant="secondary">Back to history</Button>
            </Link>
          }
        />
      </PageShell>
    );
  }

  return (
    <PageShell
      title={session.workoutName}
      headerExtra={
        <Link
          href="/history"
          className="inline-flex items-center gap-1 text-sm text-[var(--accent)] hover:underline"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
          History
        </Link>
      }
      className="pb-8"
    >
      <div className="mb-6">
        <BodyHeatmap
          exerciseNames={[...new Set(session.sets.map((s) => s.exerciseName))]}
          title="Trained in this session"
          subtitle="Primary in solid, secondary lighter"
        />
      </div>
      <SessionDetail session={session} dataset={dataset} />
    </PageShell>
  );
}
