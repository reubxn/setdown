"use client";

import { useMemo, useRef, useEffect, useState } from "react";
import {
  addDays,
  differenceInCalendarDays,
  endOfYear,
  format,
  isAfter,
  startOfWeek,
  startOfYear,
  subDays,
} from "date-fns";
import { useRouter } from "next/navigation";
import { Card, CardHeader } from "@/components/ui/card";
import { SegmentedControl } from "@/components/ui/segmented-control";
import type { WorkoutDataset, WorkoutSession } from "@/lib/types";

const DAY_MS = 86_400_000;
const ROLLING_WEEKS = 53;

type ViewMode = "rolling" | "year";

interface Cell {
  date: Date;
  count: number;
  volume: number;
  intensity: 0 | 1 | 2 | 3 | 4;
  session: WorkoutSession | null;
  inRange: boolean;
}

function intensityFor(volume: number, max: number): Cell["intensity"] {
  if (volume <= 0 || max <= 0) return 0;
  const ratio = volume / max;
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
  const router = useRouter();
  const today = dataset.dateRange.end;
  const todayYear = today.getFullYear();
  const earliestYear = dataset.dateRange.start.getFullYear();

  const [mode, setMode] = useState<ViewMode>("rolling");
  const [year, setYear] = useState<number>(todayYear);
  const scrollerRef = useRef<HTMLDivElement>(null);

  const sessionsByDay = useMemo(() => {
    const map = new Map<number, WorkoutSession[]>();
    for (const s of dataset.sessions) {
      const key = Math.floor(s.date.getTime() / DAY_MS);
      const arr = map.get(key);
      if (arr) arr.push(s);
      else map.set(key, [s]);
    }
    return map;
  }, [dataset]);

  const { cells, weeks } = useMemo(() => {
    let rangeStart: Date;
    let rangeEnd: Date;

    if (mode === "rolling") {
      rangeEnd = today;
      rangeStart = subDays(
        startOfWeek(today, { weekStartsOn: 1 }),
        (ROLLING_WEEKS - 1) * 7,
      );
    } else {
      rangeStart = startOfYear(new Date(year, 0, 1));
      rangeEnd = endOfYear(new Date(year, 0, 1));
    }

    const gridStart = startOfWeek(rangeStart, { weekStartsOn: 1 });
    const totalDays = differenceInCalendarDays(rangeEnd, gridStart) + 1;
    const weekCount = Math.ceil(totalDays / 7);
    const days = weekCount * 7;

    let max = 0;
    for (const sessions of sessionsByDay.values()) {
      const vol = sessions.reduce((s, x) => s + x.totalVolume, 0);
      if (vol > max) max = vol;
    }

    const out: Cell[] = [];
    for (let i = 0; i < days; i++) {
      const date = addDays(gridStart, i);
      const inRange = !isAfter(date, today) && !isAfter(rangeStart, date) &&
        !isAfter(date, rangeEnd);
      const key = Math.floor(date.getTime() / DAY_MS);
      const sessions = sessionsByDay.get(key) ?? [];
      const volume = sessions.reduce((s, x) => s + x.totalVolume, 0);
      const count = sessions.length;
      out.push({
        date,
        count,
        volume,
        intensity: inRange ? intensityFor(volume, max) : 0,
        session: sessions[0] ?? null,
        inRange,
      });
    }
    return { cells: out, weeks: weekCount };
  }, [sessionsByDay, mode, year, today]);

  const totalSessions = cells.reduce((s, c) => s + (c.inRange ? c.count : 0), 0);
  const totalVolume = cells.reduce((s, c) => s + (c.inRange ? c.volume : 0), 0);

  const monthLabels = useMemo(() => {
    const labels: { col: number; label: string }[] = [];
    let lastMonth = -1;
    for (let week = 0; week < weeks; week++) {
      const firstDay = cells[week * 7]?.date;
      if (!firstDay) continue;
      const m = firstDay.getMonth();
      if (m !== lastMonth) {
        labels.push({ col: week, label: format(firstDay, "MMM") });
        lastMonth = m;
      }
    }
    return labels;
  }, [cells, weeks]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollLeft = el.scrollWidth;
  }, [mode, year]);

  const yearOptions = useMemo(() => {
    const years: number[] = [];
    for (let y = todayYear; y >= earliestYear; y--) years.push(y);
    return years;
  }, [todayYear, earliestYear]);

  const handleCellClick = (cell: Cell) => {
    if (!cell.session) return;
    router.push(`/history/${encodeURIComponent(cell.session.id)}`);
  };

  const subtitle =
    mode === "rolling"
      ? `${totalSessions} sessions in the last year`
      : `${totalSessions} sessions in ${year} · ${Math.round(totalVolume).toLocaleString()} kg`;

  return (
    <Card padding="lg" className="@container">
      <CardHeader
        title="Workout frequency"
        subtitle={subtitle}
        action={
          <div className="flex items-center gap-2">
            <SegmentedControl
              size="sm"
              aria-label="View"
              options={[
                { value: "rolling", label: "Rolling" },
                { value: "year", label: "Year" },
              ]}
              value={mode}
              onChange={(v) => setMode(v as ViewMode)}
            />
            {mode === "year" ? (
              <select
                aria-label="Year"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="h-8 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-sunken)] px-2 text-xs text-[var(--text-primary)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            ) : null}
          </div>
        }
      />
      <div
        ref={scrollerRef}
        className="w-full overflow-x-auto pb-1"
        style={{ scrollbarWidth: "thin" }}
      >
        <div style={{ minWidth: `${weeks * 14}px` }}>
          <div
            className="mb-1 grid gap-[3px] text-[10px] text-[var(--text-muted)]"
            style={{ gridTemplateColumns: `repeat(${weeks}, 11px)` }}
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
              gridTemplateColumns: `repeat(${weeks}, 11px)`,
              gridAutoFlow: "column",
              gridTemplateRows: "repeat(7, 11px)",
            }}
          >
            {cells.map((cell, i) => {
              const dateLabel = format(cell.date, "MMM d, yyyy");
              const title = !cell.inRange
                ? dateLabel
                : cell.count === 0
                  ? `${dateLabel} — No workout`
                  : `${dateLabel} — ${cell.count} session${cell.count === 1 ? "" : "s"} · ${Math.round(cell.volume).toLocaleString()} kg`;
              const clickable = cell.inRange && cell.session;
              return clickable ? (
                <button
                  key={i}
                  type="button"
                  title={title}
                  aria-label={title}
                  onClick={() => handleCellClick(cell)}
                  className={`h-[11px] w-[11px] rounded-[2px] outline-none transition-transform hover:scale-125 focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${intensityClass[cell.intensity]}`}
                />
              ) : (
                <div
                  key={i}
                  title={title}
                  className={`h-[11px] w-[11px] rounded-[2px] ${intensityClass[cell.intensity]} ${cell.inRange ? "" : "opacity-40"}`}
                />
              );
            })}
          </div>
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
