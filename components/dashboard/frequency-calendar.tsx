"use client";

import { useMemo } from "react";
import {
  addDays,
  differenceInCalendarDays,
  format,
  startOfWeek,
  subDays,
} from "date-fns";
import { Card, CardHeader } from "@/components/ui/card";
import type { WorkoutDataset } from "@/lib/types";

const DAY_MS = 86_400_000;
const WEEKS = 53;

interface WeekCell {
  weekStart: Date;
  count: number;
  intensity: 0 | 1 | 2 | 3 | 4;
}

function intensityFor(count: number, max: number): WeekCell["intensity"] {
  if (count === 0 || max === 0) return 0;
  const ratio = count / max;
  if (ratio > 0.75) return 4;
  if (ratio > 0.5) return 3;
  if (ratio > 0.25) return 2;
  return 1;
}

const intensityClass: Record<WeekCell["intensity"], string> = {
  0: "bg-[var(--bg-sunken)]",
  1: "bg-[color-mix(in_oklab,var(--accent)_18%,var(--bg-sunken))]",
  2: "bg-[color-mix(in_oklab,var(--accent)_38%,var(--bg-sunken))]",
  3: "bg-[color-mix(in_oklab,var(--accent)_65%,var(--bg-sunken))]",
  4: "bg-[var(--accent)]",
};

export function FrequencyCalendar({ dataset }: { dataset: WorkoutDataset }) {
  const weeks = useMemo<WeekCell[]>(() => {
    const today = dataset.dateRange.end;
    const endAnchor = startOfWeek(today, { weekStartsOn: 1 });
    const start = subDays(endAnchor, (WEEKS - 1) * 7);

    const counts = new Map<number, number>();
    for (const s of dataset.sessions) {
      const dayKey = Math.floor(s.date.getTime() / DAY_MS);
      counts.set(dayKey, (counts.get(dayKey) ?? 0) + 1);
    }

    const weekCounts: WeekCell[] = [];
    let max = 0;
    for (let w = 0; w < WEEKS; w++) {
      const weekStart = addDays(start, w * 7);
      let weekCount = 0;
      for (let d = 0; d < 7; d++) {
        const date = addDays(weekStart, d);
        if (differenceInCalendarDays(date, today) > 0) break;
        const dayKey = Math.floor(date.getTime() / DAY_MS);
        weekCount += counts.get(dayKey) ?? 0;
      }
      if (weekCount > max) max = weekCount;
      weekCounts.push({ weekStart, count: weekCount, intensity: 0 });
    }
    for (const wc of weekCounts) {
      wc.intensity = intensityFor(wc.count, max);
    }
    return weekCounts;
  }, [dataset]);

  const totalSessions = weeks.reduce((s, w) => s + w.count, 0);

  const monthLabels = useMemo(() => {
    const labels: { col: number; label: string }[] = [];
    let lastMonth = -1;
    for (let i = 0; i < weeks.length; i++) {
      const m = weeks[i].weekStart.getMonth();
      if (m !== lastMonth) {
        labels.push({ col: i, label: format(weeks[i].weekStart, "MMM") });
        lastMonth = m;
      }
    }
    return labels;
  }, [weeks]);

  return (
    <Card padding="lg" className="@container">
      <CardHeader
        title="Workout frequency"
        subtitle={`${totalSessions} sessions in the last year`}
      />
      <div className="w-full">
        <div
          className="mb-1 grid gap-[3px] text-[10px] text-[var(--text-muted)]"
          style={{ gridTemplateColumns: `repeat(${WEEKS}, minmax(0, 1fr))` }}
        >
          {monthLabels.map((m) => (
            <div
              key={`${m.col}-${m.label}`}
              style={{ gridColumnStart: m.col + 1 }}
            >
              {m.label}
            </div>
          ))}
        </div>
        <div
          className="grid gap-[3px]"
          style={{ gridTemplateColumns: `repeat(${WEEKS}, minmax(0, 1fr))` }}
        >
          {weeks.map((week, i) => (
            <div
              key={i}
              title={`Week of ${format(week.weekStart, "MMM d, yyyy")} — ${week.count} session${week.count === 1 ? "" : "s"}`}
              className={`h-10 rounded-[3px] ${intensityClass[week.intensity]}`}
            />
          ))}
        </div>
      </div>
      <div className="mt-3 flex items-center justify-end gap-2 text-[10px] text-[var(--text-muted)]">
        <span>Less</span>
        {[0, 1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className={`h-3 w-3 rounded-[2px] ${intensityClass[i as WeekCell["intensity"]]}`}
          />
        ))}
        <span>More</span>
      </div>
    </Card>
  );
}
