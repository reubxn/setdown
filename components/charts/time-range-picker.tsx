"use client";

import { TIME_RANGE_OPTIONS, type TimeRange } from "@/lib/time-range";
import { cn } from "@/lib/utils";

export function TimeRangePicker({
  value,
  onChange,
  className,
}: {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex rounded-lg bg-[var(--bg-secondary)] p-0.5",
        className
      )}
      role="group"
      aria-label="Chart time range"
    >
      {TIME_RANGE_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            "rounded-md px-2.5 py-1 text-[10px] font-semibold tracking-wide transition-colors",
            value === opt.value
              ? "bg-white text-black"
              : "text-[var(--text-muted)] hover:text-white"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
