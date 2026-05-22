"use client";

import { Card } from "@/components/ui/card";
import { TimeRangePicker } from "./time-range-picker";
import { timeRangeLabel, type TimeRange } from "@/lib/time-range";
import { cn } from "@/lib/utils";

export function ChartCard({
  title,
  range,
  onRangeChange,
  children,
  subtitle,
  className,
  emptyMessage = "No data in this range",
  hasData = true,
}: {
  title: string;
  range: TimeRange;
  onRangeChange: (r: TimeRange) => void;
  children: React.ReactNode;
  subtitle?: string;
  className?: string;
  emptyMessage?: string;
  hasData?: boolean;
}) {
  return (
    <Card className={cn(className)} padding="sm">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-medium tracking-[0.08em] text-[var(--text-muted)] uppercase">
            {title}
          </p>
          {subtitle && (
            <p className="mt-0.5 text-[10px] text-[var(--text-muted)]">{subtitle}</p>
          )}
        </div>
        <TimeRangePicker value={range} onChange={onRangeChange} />
      </div>
      <p className="mb-2 text-[10px] text-[var(--text-muted)]">
        {timeRangeLabel(range)}
      </p>
      {hasData ? (
        <div className="chart-surface w-full">{children}</div>
      ) : (
        <p className="py-8 text-center text-sm text-[var(--text-muted)]">
          {emptyMessage}
        </p>
      )}
    </Card>
  );
}
