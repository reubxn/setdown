"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  addDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import type { WorkoutSession } from "@/lib/types";
import { formatDuration, formatVolume } from "@/lib/metrics";

function groupByMonth(sessions: WorkoutSession[]): Map<string, WorkoutSession[]> {
  const map = new Map<string, WorkoutSession[]>();
  for (const s of sessions) {
    const key = format(s.date, "yyyy-MM");
    const arr = map.get(key) ?? [];
    arr.push(s);
    map.set(key, arr);
  }
  return map;
}

function MonthGrid({
  monthDate,
  sessions,
}: {
  monthDate: Date;
  sessions: WorkoutSession[];
}) {
  const start = startOfWeek(startOfMonth(monthDate), { weekStartsOn: 1 });
  const end = endOfWeek(endOfMonth(monthDate), { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start, end });

  const byDay = useMemo(() => {
    const map = new Map<string, WorkoutSession[]>();
    for (const s of sessions) {
      const key = format(s.date, "yyyy-MM-dd");
      const arr = map.get(key) ?? [];
      arr.push(s);
      map.set(key, arr);
    }
    return map;
  }, [sessions]);

  const weekdayLabels = useMemo(() => {
    const base = startOfWeek(new Date(), { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => format(addDays(base, i), "EEEEE"));
  }, []);

  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4">
      <p className="mb-3 text-sm font-medium text-[var(--text-primary)]">
        {format(monthDate, "MMMM yyyy")}
      </p>
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] tracking-[0.08em] text-[var(--text-muted)] uppercase">
        {weekdayLabels.map((d, i) => (
          <div key={i} className="py-1">{d}</div>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const dayWorkouts = byDay.get(key);
          const inMonth = isSameMonth(day, monthDate);
          const isToday = isSameDay(day, new Date());
          const hasWorkout = !!dayWorkouts?.length;
          const totalVolume = dayWorkouts?.reduce((s, w) => s + w.totalVolume, 0) ?? 0;
          const firstSessionId = dayWorkouts?.[0]?.id;

          const content = (
            <div
              className={[
                "aspect-square flex flex-col items-center justify-center rounded text-xs tabular-nums transition-colors",
                inMonth
                  ? "text-[var(--text-secondary)]"
                  : "text-[var(--text-muted)]/40",
                hasWorkout
                  ? "bg-[var(--accent-muted)] hover:bg-[color-mix(in_srgb,var(--accent)_30%,transparent)]"
                  : "bg-transparent",
                isToday ? "ring-1 ring-[var(--accent)]" : "",
              ].join(" ")}
              title={
                hasWorkout
                  ? `${dayWorkouts!.length} workout${dayWorkouts!.length > 1 ? "s" : ""} · ${formatVolume(totalVolume)}`
                  : undefined
              }
            >
              <span className={hasWorkout ? "text-[var(--text-primary)] font-medium" : ""}>
                {format(day, "d")}
              </span>
              {hasWorkout ? (
                <span className="mt-0.5 h-1 w-1 rounded-full bg-[var(--accent)]" />
              ) : null}
            </div>
          );

          if (hasWorkout && firstSessionId) {
            return (
              <Link
                key={key}
                href={`/history/${encodeURIComponent(firstSessionId)}`}
                aria-label={`${format(day, "MMM d")}: ${dayWorkouts!.length} workout(s), ${formatDuration(dayWorkouts!.reduce((s, w) => s + (w.durationMinutes ?? 0), 0))}`}
              >
                {content}
              </Link>
            );
          }
          return <div key={key}>{content}</div>;
        })}
      </div>
    </div>
  );
}

export function CalendarView({ sessions }: { sessions: WorkoutSession[] }) {
  const months = useMemo(() => {
    const byMonth = groupByMonth(sessions);
    return [...byMonth.entries()]
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([key, monthSessions]) => {
        const [y, m] = key.split("-").map(Number);
        return { date: new Date(y, m - 1, 1), sessions: monthSessions };
      });
  }, [sessions]);

  if (months.length === 0) {
    return (
      <p className="text-sm text-[var(--text-muted)]">
        No sessions in this range.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
      {months.map((month) => (
        <MonthGrid
          key={format(month.date, "yyyy-MM")}
          monthDate={month.date}
          sessions={month.sessions}
        />
      ))}
    </div>
  );
}
