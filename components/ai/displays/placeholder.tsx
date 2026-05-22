"use client";

import type { ReactNode } from "react";

export function DisplayPlaceholder({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-2 text-xs text-[var(--text-muted)]">
      {children}
    </div>
  );
}
