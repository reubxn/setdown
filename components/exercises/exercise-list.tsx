"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { WorkoutDataset } from "@/lib/types";
import { bucketOf, BUCKETS, type Bucket } from "@/lib/derive/muscle-mapping";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { ExerciseCard, type ExerciseRow } from "./exercise-card";
import { subDays } from "date-fns";

type SortKey = "alpha" | "last" | "max" | "volume";
type RecencyFilter = "any" | "30d" | "90d";

const SORT_OPTIONS: ReadonlyArray<{ value: SortKey; label: string }> = [
  { value: "last", label: "Recent" },
  { value: "alpha", label: "A–Z" },
  { value: "max", label: "Max" },
  { value: "volume", label: "Volume" },
];

const RECENCY_OPTIONS: ReadonlyArray<{ value: RecencyFilter; label: string }> = [
  { value: "any", label: "Any" },
  { value: "30d", label: "30d" },
  { value: "90d", label: "90d" },
];

const MUSCLE_OPTIONS: ReadonlyArray<{ value: Bucket | "all"; label: string }> = [
  { value: "all", label: "All" },
  ...BUCKETS.map((b) => ({
    value: b,
    label: b[0].toUpperCase() + b.slice(1),
  })),
];

function buildRows(dataset: WorkoutDataset): ExerciseRow[] {
  const now = dataset.dateRange.end;
  const thirtyDaysAgo = subDays(now, 30);
  const rows = new Map<string, ExerciseRow>();

  for (const name of dataset.exercises) {
    rows.set(name, {
      name,
      bucket: bucketOf(name),
      maxWeight: 0,
      volume30d: 0,
      lastPerformed: null,
      sparkline: [],
    });
  }

  const sparkBySession = new Map<string, Map<string, number>>();

  for (const session of dataset.sessions) {
    for (const set of session.sets) {
      const row = rows.get(set.exerciseName);
      if (!row) continue;
      if (set.setType === "warmup") {
        // still tracks last performed if it's only warmups
      } else {
        if (set.weight > row.maxWeight) row.maxWeight = set.weight;
        if (session.date >= thirtyDaysAgo && set.volume > 0) {
          row.volume30d += set.volume;
        }
      }
      if (!row.lastPerformed || session.date > row.lastPerformed) {
        row.lastPerformed = session.date;
      }
      if (set.weight > 0) {
        const m = sparkBySession.get(set.exerciseName) ?? new Map();
        const key = session.id;
        const prev = m.get(key) ?? 0;
        if (set.weight > prev) m.set(key, set.weight);
        sparkBySession.set(set.exerciseName, m);
      }
    }
  }

  for (const [name, sessionMap] of sparkBySession) {
    const row = rows.get(name);
    if (!row) continue;
    const values = [...sessionMap.values()];
    row.sparkline = values.slice(-12);
  }

  return [...rows.values()];
}

export function ExerciseList({ dataset }: { dataset: WorkoutDataset }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("last");
  const [recency, setRecency] = useState<RecencyFilter>("any");
  const [muscle, setMuscle] = useState<Bucket | "all">("all");

  const allRows = useMemo(() => buildRows(dataset), [dataset]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    const now = dataset.dateRange.end;
    const cutoff =
      recency === "30d"
        ? subDays(now, 30)
        : recency === "90d"
          ? subDays(now, 90)
          : null;

    let rows = allRows;
    if (q) rows = rows.filter((r) => r.name.toLowerCase().includes(q));
    if (muscle !== "all") rows = rows.filter((r) => r.bucket === muscle);
    if (cutoff) {
      rows = rows.filter((r) => r.lastPerformed && r.lastPerformed >= cutoff);
    }

    const sorted = [...rows];
    switch (sort) {
      case "alpha":
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "last":
        sorted.sort((a, b) => {
          const at = a.lastPerformed?.getTime() ?? 0;
          const bt = b.lastPerformed?.getTime() ?? 0;
          return bt - at;
        });
        break;
      case "max":
        sorted.sort((a, b) => b.maxWeight - a.maxWeight);
        break;
      case "volume":
        sorted.sort((a, b) => b.volume30d - a.volume30d);
        break;
    }
    return sorted;
  }, [allRows, dataset, muscle, query, recency, sort]);

  return (
    <div className="flex flex-col gap-4">
      <div className="relative max-w-xl">
        <Search
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]"
          strokeWidth={1.5}
        />
        <input
          type="search"
          placeholder="Search exercises…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] py-2.5 pl-10 pr-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--accent)]"
        />
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-3">
        <div className="flex items-center gap-2">
          <span className="text-[11px] uppercase tracking-wide text-[var(--text-muted)]">
            Muscle
          </span>
          <SegmentedControl
            size="sm"
            options={MUSCLE_OPTIONS}
            value={muscle}
            onChange={setMuscle}
            aria-label="Filter by muscle group"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] uppercase tracking-wide text-[var(--text-muted)]">
            Last
          </span>
          <SegmentedControl
            size="sm"
            options={RECENCY_OPTIONS}
            value={recency}
            onChange={setRecency}
            aria-label="Filter by last performed"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] uppercase tracking-wide text-[var(--text-muted)]">
            Sort
          </span>
          <SegmentedControl
            size="sm"
            options={SORT_OPTIONS}
            value={sort}
            onChange={setSort}
            aria-label="Sort"
          />
        </div>
      </div>

      <p className="text-xs text-[var(--text-muted)]">
        {filtered.length} {filtered.length === 1 ? "exercise" : "exercises"}
      </p>

      {filtered.length === 0 ? (
        <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--border-subtle)] p-8 text-center text-sm text-[var(--text-muted)]">
          No exercises match your filters.
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {filtered.map((row) => (
            <li key={row.name}>
              <ExerciseCard row={row} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
