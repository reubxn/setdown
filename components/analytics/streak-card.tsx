// <StreakCard dataset={dataset} />
"use client";

import { differenceInCalendarDays, endOfWeek, startOfWeek } from "date-fns";
import { Flame } from "lucide-react";
import type { WorkoutDataset } from "@/lib/types";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { usePreferences } from "@/context/preferences-context";

interface StreakStats {
  currentWeeks: number;
  longestWeeks: number;
  totalActiveWeeks: number;
  lastWorkoutDays: number | null;
}

function weekKey(d: Date, weekStartsOn: 0 | 1): string {
  const ws = startOfWeek(d, { weekStartsOn });
  return `${ws.getFullYear()}-${ws.getMonth()}-${ws.getDate()}`;
}

function computeStreaks(
  dataset: WorkoutDataset,
  weekStartsOn: 0 | 1,
): StreakStats {
  if (dataset.sessions.length === 0) {
    return {
      currentWeeks: 0,
      longestWeeks: 0,
      totalActiveWeeks: 0,
      lastWorkoutDays: null,
    };
  }

  const activeWeeks = new Set<string>();
  for (const s of dataset.sessions) activeWeeks.add(weekKey(s.date, weekStartsOn));

  const sortedKeys = Array.from(activeWeeks)
    .map((k) => {
      const [y, m, d] = k.split("-").map(Number);
      return new Date(y, m, d);
    })
    .sort((a, b) => a.getTime() - b.getTime());

  let longest = 1;
  let run = 1;
  for (let i = 1; i < sortedKeys.length; i++) {
    const gapDays = differenceInCalendarDays(sortedKeys[i], sortedKeys[i - 1]);
    if (gapDays <= 7) {
      run += 1;
      if (run > longest) longest = run;
    } else {
      run = 1;
    }
  }

  // current streak: consecutive weeks ending at the most recent active week
  // that is within one week of "today" (dataset.dateRange.end).
  const today = dataset.dateRange.end;
  const thisWeek = startOfWeek(today, { weekStartsOn });
  const lastActive = sortedKeys[sortedKeys.length - 1];
  let current = 0;
  if (differenceInCalendarDays(thisWeek, lastActive) <= 7) {
    current = 1;
    for (let i = sortedKeys.length - 2; i >= 0; i--) {
      const gap = differenceInCalendarDays(sortedKeys[i + 1], sortedKeys[i]);
      if (gap <= 7) current += 1;
      else break;
    }
  }

  const lastSession = dataset.sessions[dataset.sessions.length - 1];
  const lastWorkoutDays = differenceInCalendarDays(today, lastSession.date);

  return {
    currentWeeks: current,
    longestWeeks: longest,
    totalActiveWeeks: activeWeeks.size,
    lastWorkoutDays,
  };
}

function StatBlock({ label, value, unit }: { label: string; value: number | string; unit?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="text-[11px] font-medium uppercase tracking-wide text-[var(--text-muted)]">
        {label}
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="tabular-nums text-2xl font-semibold text-[var(--text-primary)]">
          {value}
        </span>
        {unit ? (
          <span className="text-xs text-[var(--text-muted)]">{unit}</span>
        ) : null}
      </div>
    </div>
  );
}

export function StreakCard({ dataset }: { dataset: WorkoutDataset }) {
  const { weekStartsOn } = usePreferences();
  const stats = computeStreaks(dataset, weekStartsOn);
  const onStreak = stats.currentWeeks > 0;

  const weekStart = startOfWeek(dataset.dateRange.end, { weekStartsOn });
  const weekEnd = endOfWeek(dataset.dateRange.end, { weekStartsOn });
  const sessionsThisWeek = dataset.sessions.filter(
    (s) => s.date >= weekStart && s.date <= weekEnd,
  ).length;

  return (
    <Card>
      <CardHeader
        title={
          <span className="flex items-center gap-2">
            <Flame
              className={`h-4 w-4 ${onStreak ? "text-[var(--accent)]" : "text-[var(--text-muted)]"}`}
              aria-hidden
            />
            Training streak
          </span>
        }
        subtitle={
          stats.lastWorkoutDays != null
            ? `Last workout ${stats.lastWorkoutDays === 0 ? "today" : `${stats.lastWorkoutDays}d ago`}`
            : undefined
        }
      />
      <CardBody>
        <div className="grid grid-cols-3 gap-4">
          <StatBlock label="Current" value={stats.currentWeeks} unit="wk" />
          <StatBlock label="Longest" value={stats.longestWeeks} unit="wk" />
          <StatBlock label="Total active" value={stats.totalActiveWeeks} unit="wk" />
        </div>
        <div className="mt-4 text-xs text-[var(--text-muted)]">
          {sessionsThisWeek > 0
            ? `${sessionsThisWeek} session${sessionsThisWeek === 1 ? "" : "s"} this week`
            : "No sessions this week yet"}
        </div>
      </CardBody>
    </Card>
  );
}
