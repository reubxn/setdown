"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { useDataset } from "@/context/dataset-context";
import { slugifyExercise } from "@/lib/parse-strong-csv";
import { exerciseStats } from "@/lib/metrics";
import { PageShell } from "@/components/layout/page-shell";

export default function ExercisesPage() {
  const { dataset } = useDataset();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!dataset) return [];
    const q = query.toLowerCase().trim();
    if (!q) return dataset.exercises;
    return dataset.exercises.filter((e) => e.toLowerCase().includes(q));
  }, [dataset, query]);

  if (!dataset) return null;

  return (
    <PageShell
      title="Exercises"
      subtitle={`${dataset.exercises.length} exercises in your export`}
    >
      <div className="relative max-w-xl">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" strokeWidth={1.5} />
        <input
          type="search"
          placeholder="Search exercises…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-xl border border-white/10 bg-[var(--card)] py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--accent-blue)]/50"
        />
      </div>

      <ul className="mt-6 grid grid-cols-1 gap-1 sm:grid-cols-2 xl:grid-cols-3 max-h-[calc(100dvh-12rem)] lg:max-h-[calc(100dvh-10rem)] overflow-y-auto">
        {filtered.map((name) => {
          const { maxWeight } = exerciseStats(dataset, name);
          return (
            <li key={name}>
              <Link
                href={`/exercises/${slugifyExercise(name)}`}
                className="flex items-center justify-between rounded-xl px-3 py-3 hover:bg-[var(--card)] transition-colors"
              >
                <span className="text-sm font-medium truncate pr-2">{name}</span>
                {maxWeight > 0 && (
                  <span className="shrink-0 text-xs text-[var(--text-muted)] tabular-nums">
                    {maxWeight} kg max
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </PageShell>
  );
}
