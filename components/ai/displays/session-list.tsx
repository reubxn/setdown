"use client";

import { format, isValid, parseISO } from "date-fns";
import type { ChatDisplay } from "@/lib/ai/display";
import { DisplayPlaceholder } from "./placeholder";

type SessionListProps = Extract<ChatDisplay, { kind: "session_list" }>;

function safeFormatDate(iso: string): string {
  const d = parseISO(iso);
  return isValid(d) ? format(d, "EEE MMM d") : iso;
}

export function SessionListDisplay({ sessions }: SessionListProps) {
  if (sessions.length === 0) {
    return <DisplayPlaceholder>No recent sessions found.</DisplayPlaceholder>;
  }
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-3">
      <div className="mb-2 text-[11px] font-medium uppercase tracking-wide text-[var(--text-muted)]">
        Recent sessions
      </div>
      <ul className="divide-y divide-[var(--border-subtle)]">
        {sessions.map((s, i) => (
          <li key={`${s.date}-${i}`} className="py-2 first:pt-0 last:pb-0">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-sm text-[var(--text-primary)]">
                {s.name && s.name.trim().length > 0 ? s.name : "Workout"}
              </span>
              <span className="shrink-0 text-xs text-[var(--text-muted)]">
                {safeFormatDate(s.date)}
              </span>
            </div>
            {s.topLifts.length > 0 ? (
              <div className="mt-0.5 truncate text-xs text-[var(--text-secondary)]">
                {s.topLifts.join(" · ")}
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
