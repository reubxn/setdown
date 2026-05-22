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
const DAYS = WEEKS * 7;

interface Cell {
  date: Date;
  count: number;
  intensity: 0 | 1 | 2 | 3 | 4;
}

function intensityFor(count: number, max: number): Cell["intensity"] {
  if (count === 0 || max === 0) return 0;
  const ratio = count / max;
  if (ratio > 0.75) return 4;
  if (ratio > 0.5) return 3;
  if (ratio > 0.25) return 2;
  return 1;
}

const intensityClass: Record<Cell["intensity"], string> = {
  0: "bg-[var(--bg-sunken)]",
  1: "bg-[color-mix(in_oklab,var(--accent)_18%,var(--bg-sunken))]",
  2: "bg-[color-mix(in_oklab,var(--accent)_38%,var(--bg-sunken))]",
  3: "bg-[color-mix(in_oklab,var(--accent)_65%,var(--bg-sunken))]",
  4: "bg-[var(--accent)]",
};

export function FrequencyCalendar({ dataset }: { dataset: WorkoutDataset }) {
  const cells = useMemo<Cell[]>(() => {
    const today = dataset.dateRange.end;
    const endAnchor = startOfWeek(today, { weekStartsOn: 1 });
    const start = subDays(endAnchor, (WEEKS - 1) * 7);

    const counts = new Map<number, number>();
    for (const s of dataset.sessions) {
      const dayKey = Math.floor(s.date.getTime() / DAY_MS);
      counts.set(dayKey, (counts.get(dayKey) ?? 0) + 1);
    }

    let max = 0;
    for (const c of counts.values()) if (c > max) max = c;

    const out: Cell[] = [];
    for (let i = 0; i < DAYS; i++) {
      const date = addDays(start, i);
      if (differenceInCalendarDays(date, today) > 0) {
        out.push({ date, count: 0, intensity: 0 });
        continue;
      }
      const dayKey = Math.floor(date.getTime() / DAY_MS);
      const count = counts.get(dayKey) ?? 0;
      out.push({ date, count, intensity: intensityFor(count, max) });
    }
    return out;
  }, [dataset]);

  const totalSessions = cells.reduce((s, c) => s + c.count, 0);

  const monthLabels = useMemo(() => {
    const labels: { col: number; label: string }[] = [];
    let lastMonth = -1;
    for (let week = 0; week < WEEKS; week++) {
      const firstDay = cells[week * 7]?.date;
      if (!firstDay) continue;
      const m = firstDay.getMonth();
      if (m !== lastMonth) {
        labels.push({ col: week, label: format(firstDay, "MMM") });
        lastMonth = m;
      }
    }
    return labels;
  }, [cells]);

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
          style={{
            gridTemplateColumns: `repeat(${WEEKS}, minmax(0, 1fr))`,
            gridAutoFlow: "column",
            gridTemplateRows: "repeat(7, minmax(0, 1fr))",
          }}
        >
          {cells.map((cell, i) => (
            <div
              key={i}
              title={`${format(cell.date, "MMM d, yyyy")} — ${cell.count} session${cell.count === 1 ? "" : "s"}`}
              className={`aspect-square w-full rounded-[2px] ${intensityClass[cell.intensity]}`}
            />
          ))}
        </div>
      </div>
      <div className="mt-3 flex items-center justify-end gap-2 text-[10px] text-[var(--text-muted)]">
        <span>Less</span>
        {[0, 1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className={`h-3 w-3 rounded-[2px] ${intensityClass[i as Cell["intensity"]]}`}
          />
        ))}
        <span>More</span>
      </div>
    </Card>
  );
}
