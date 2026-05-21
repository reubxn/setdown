// <Metric label="Volume" value="12,430" unit="kg" delta={{value:"+8%", direction:"up"}} />
"use client";

import { type ReactNode } from "react";
import { ArrowDown, ArrowRight, ArrowUp } from "lucide-react";
import { cn } from "./utils";

export interface MetricDelta {
  value: ReactNode;
  direction?: "up" | "down" | "flat";
  sentiment?: "positive" | "negative" | "neutral";
}

export interface MetricProps {
  label: ReactNode;
  value: ReactNode;
  unit?: ReactNode;
  delta?: MetricDelta;
  hint?: ReactNode;
  sparkline?: ReactNode;
  className?: string;
}

const sentimentColor: Record<NonNullable<MetricDelta["sentiment"]>, string> = {
  positive: "text-[var(--success)]",
  negative: "text-[var(--danger)]",
  neutral: "text-[var(--text-muted)]",
};

function deltaIcon(direction: MetricDelta["direction"]) {
  if (direction === "up") return <ArrowUp className="h-3 w-3" aria-hidden />;
  if (direction === "down") return <ArrowDown className="h-3 w-3" aria-hidden />;
  return <ArrowRight className="h-3 w-3" aria-hidden />;
}

export function Metric({
  label,
  value,
  unit,
  delta,
  hint,
  sparkline,
  className,
}: MetricProps) {
  const sentiment = delta?.sentiment ?? (delta?.direction === "up"
    ? "positive"
    : delta?.direction === "down"
      ? "negative"
      : "neutral");
  return (
    <div className={cn("@container flex flex-col gap-1", className)}>
      <div className="text-[11px] font-medium uppercase tracking-wide text-[var(--text-muted)]">
        {label}
      </div>
      <div className="flex items-baseline gap-1.5 flex-wrap">
        <span className="tabular-nums font-semibold text-[var(--text-primary)] text-2xl @sm:text-3xl @lg:text-4xl leading-none">
          {value}
        </span>
        {unit ? (
          <span className="text-xs @sm:text-sm text-[var(--text-muted)] font-medium">
            {unit}
          </span>
        ) : null}
      </div>
      <div className="flex items-center gap-2 min-h-[1rem]">
        {delta ? (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 text-xs font-medium tabular-nums",
              sentimentColor[sentiment],
            )}
          >
            {deltaIcon(delta.direction)}
            {delta.value}
          </span>
        ) : null}
        {hint ? (
          <span className="text-xs text-[var(--text-muted)]">{hint}</span>
        ) : null}
      </div>
      {sparkline ? (
        <div className="mt-2 -mb-1 h-8 @sm:h-10">{sparkline}</div>
      ) : null}
    </div>
  );
}
