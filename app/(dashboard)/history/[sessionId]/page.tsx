"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useDataset } from "@/context/dataset-context";
import { PageShell } from "@/components/layout/page-shell";
import { SessionDetail } from "@/components/history/session-detail";

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
        <p className="text-sm text-[var(--text-muted)]">No data loaded.</p>
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
        <p className="text-sm text-[var(--text-muted)]">
          We couldn’t find that session.
        </p>
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
      <SessionDetail session={session} dataset={dataset} />
    </PageShell>
  );
}
