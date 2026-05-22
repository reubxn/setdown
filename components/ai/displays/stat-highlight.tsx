"use client";

import type { ChatDisplay } from "@/lib/ai/display";
import { Metric } from "@/components/ui/metric";

type StatHighlightProps = Extract<ChatDisplay, { kind: "stat_highlight" }>;

export function StatHighlightDisplay({
  label,
  value,
  unit,
  delta,
  context,
}: StatHighlightProps) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-3">
      <Metric
        label={label}
        value={value}
        unit={unit}
        delta={delta}
        hint={context}
      />
    </div>
  );
}
