"use client";

import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { format } from "date-fns";
import type { OneRMPoint } from "@/lib/derive/one-rm";

const tooltipStyle = {
  backgroundColor: "var(--bg-elevated)",
  border: "1px solid var(--border-subtle)",
  borderRadius: "8px",
  color: "var(--text-primary)",
  fontSize: "12px",
};

export interface OneRMSeries {
  name: string;
  color: string;
  points: OneRMPoint[];
}

export function OneRMChart({
  series,
  height = 280,
}: {
  series: OneRMSeries[];
  height?: number;
}) {
  const allDates = new Set<string>();
  for (const s of series) {
    for (const p of s.points) allDates.add(p.date.toISOString());
  }
  const sortedDates = [...allDates].sort();

  if (sortedDates.length === 0) {
    return (
      <div
        style={{ height }}
        className="flex items-center justify-center rounded-[var(--radius-md)] border border-dashed border-[var(--border-subtle)] text-xs text-[var(--text-muted)]"
      >
        Not enough data to chart 1RM yet.
      </div>
    );
  }

  const rows = sortedDates.map((iso) => {
    const row: Record<string, number | string> = { date: iso };
    for (const s of series) {
      const point = s.points.find((p) => p.date.toISOString() === iso);
      if (point) row[s.name] = point.est1RM;
    }
    return row;
  });

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={rows}
          margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
        >
          <XAxis
            dataKey="date"
            tick={{ fill: "var(--text-muted)", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            minTickGap={28}
            tickFormatter={(iso: string) => format(new Date(iso), "MMM d")}
          />
          <YAxis
            tick={{ fill: "var(--text-muted)", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            width={36}
            tickFormatter={(v: number) => `${Math.round(v)}`}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            labelFormatter={(iso: string) =>
              format(new Date(iso), "MMM d, yyyy")
            }
            formatter={(v: number, name: string) => [
              `${v.toFixed(1)} kg`,
              name,
            ]}
          />
          {series.map((s) => (
            <Line
              key={s.name}
              type="monotone"
              dataKey={s.name}
              stroke={s.color}
              strokeWidth={2}
              dot={{ fill: s.color, r: 3 }}
              activeDot={{ r: 5 }}
              connectNulls
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
