"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { useDataset } from "@/context/dataset-context";
import { PageShell } from "@/components/layout/page-shell";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { sessionsInRange } from "@/lib/metrics";
import { getRangeBounds } from "@/lib/time-range";
import type { TimeRange } from "@/lib/time-range";
import { SessionCard } from "@/components/history/session-card";
import { CalendarView } from "@/components/history/calendar-view";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { CalendarDays } from "lucide-react";
import Link from "next/link";
import { HistoryListSkeleton } from "@/components/loading/page-skeletons";

type ViewMode = "list" | "calendar";

const rangeOptions = [
  { value: "1w" as const, label: "Week" },
  { value: "1m" as const, label: "Month" },
  { value: "1y" as const, label: "Year" },
  { value: "max" as const, label: "All" },
];

const viewOptions = [
  { value: "list" as const, label: "List" },
  { value: "calendar" as const, label: "Calendar" },
];

export default function HistoryPage() {
  const { dataset, loading } = useDataset();
  const [view, setView] = useState<ViewMode>("list");
  const [range, setRange] = useState<TimeRange>("1y");

  const filteredSessions = useMemo(() => {
    if (!dataset) return [];
    const { start, end } = getRangeBounds(dataset, range);
    return sessionsInRange(dataset.sessions, start, end).sort(
      (a, b) => b.date.getTime() - a.date.getTime(),
    );
  }, [dataset, range]);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof filteredSessions>();
    for (const s of filteredSessions) {
      const key = format(s.date, "yyyy-MM");
      const arr = map.get(key) ?? [];
      arr.push(s);
      map.set(key, arr);
    }
    return [...map.entries()].map(([key, sessions]) => {
      const [y, m] = key.split("-").map(Number);
      return {
        key,
        label: format(new Date(y, m - 1, 1), "MMMM yyyy"),
        sessions,
      };
    });
  }, [filteredSessions]);

  if (loading) {
    return <HistoryListSkeleton />;
  }

  if (!dataset) {
    return (
      <PageShell title="History">
        <EmptyState
          icon={CalendarDays}
          title="No workouts yet"
          description="Upload your Strong export to browse every session with calendar and list views."
          action={
            <Link href="/overview">
              <Button variant="primary">Get started</Button>
            </Link>
          }
        />
      </PageShell>
    );
  }

  return (
    <PageShell
      title="History"
      subtitle={`${dataset.sessions.length} sessions total · ${filteredSessions.length} in range`}
      headerExtra={
        <div className="flex flex-wrap items-center gap-2">
          <SegmentedControl
            options={rangeOptions}
            value={range}
            onChange={setRange}
            size="sm"
            aria-label="Time range"
          />
          <SegmentedControl
            options={viewOptions}
            value={view}
            onChange={setView}
            size="sm"
            aria-label="View mode"
          />
        </div>
      }
    >
      {filteredSessions.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No sessions in this range"
          description="Try widening the time range to see more sessions."
        />
      ) : view === "calendar" ? (
        <CalendarView sessions={filteredSessions} />
      ) : (
        <div className="space-y-8">
          {grouped.map((month) => (
            <section key={month.key}>
              <h2 className="mb-3 text-xs font-medium tracking-[0.08em] text-[var(--text-muted)] uppercase">
                {month.label}
                <span className="ml-2 normal-case text-[var(--text-muted)]/70">
                  {month.sessions.length}{" "}
                  {month.sessions.length === 1 ? "session" : "sessions"}
                </span>
              </h2>
              <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                {month.sessions.map((session) => (
                  <li key={session.id}>
                    <SessionCard session={session} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </PageShell>
  );
}
