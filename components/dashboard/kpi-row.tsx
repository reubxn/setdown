"use client";

import { Metric, type MetricDelta } from "@/components/ui/metric";
import { Card } from "@/components/ui/card";
import { cn } from "@/components/ui/utils";

export interface KpiItem {
  label: string;
  value: string;
  unit?: string;
  delta?: MetricDelta;
  hint?: string;
}

export function KpiRow({
  items,
  className,
}: {
  items: KpiItem[];
  className?: string;
}) {
  return (
    <Card padding="lg" className={cn("@container", className)}>
      <div className="grid grid-cols-2 gap-x-3 gap-y-5 @sm:gap-x-6 @md:grid-cols-4">
        {items.map((item) => (
          <Metric
            key={item.label}
            label={item.label}
            value={item.value}
            unit={item.unit}
            delta={item.delta}
            hint={item.hint}
          />
        ))}
      </div>
    </Card>
  );
}
