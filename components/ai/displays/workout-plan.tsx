"use client";

import type { ChatDisplay } from "@/lib/ai/display";

type WorkoutPlanProps = Extract<ChatDisplay, { kind: "workout_plan" }>;

export function WorkoutPlanDisplay({
  title,
  exercises,
  notes,
}: WorkoutPlanProps) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-3">
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <div className="text-sm font-medium text-[var(--text-primary)]">
          {title}
        </div>
        <div className="text-[11px] uppercase tracking-wide text-[var(--text-muted)]">
          {exercises.length} {exercises.length === 1 ? "exercise" : "exercises"}
        </div>
      </div>
      <ul className="divide-y divide-[var(--border-subtle)]">
        {exercises.map((ex, i) => (
          <li key={`${ex.name}-${i}`} className="py-2 first:pt-0 last:pb-0">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-sm text-[var(--text-primary)]">
                {ex.name}
              </span>
              <span className="shrink-0 text-xs tabular-nums text-[var(--text-secondary)]">
                {ex.sets} × {ex.reps}
                {ex.weight != null ? (
                  <>
                    {" "}
                    <span className="text-[var(--text-muted)]">@</span>{" "}
                    {ex.weight} kg
                  </>
                ) : null}
              </span>
            </div>
            {ex.notes ? (
              <div className="mt-0.5 text-xs text-[var(--text-muted)]">
                {ex.notes}
              </div>
            ) : null}
          </li>
        ))}
      </ul>
      {notes ? (
        <div className="mt-3 border-t border-[var(--border-subtle)] pt-2 text-xs italic text-[var(--text-muted)]">
          {notes}
        </div>
      ) : null}
    </div>
  );
}
