// Inline chart embedded in an AI chat message. Self-contained: the data
// arrives in the display payload, so re-renders from chat history are instant.
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
import type { ChatDisplay } from "@/lib/ai/display";
import { DisplayPlaceholder } from "./placeholder";

type ExerciseChartProps = Extract<ChatDisplay, { kind: "exercise_chart" }>;

const tooltipStyle = {
  backgroundColor: "var(--bg-elevated)",
  border: "1px solid var(--border-subtle)",
  borderRadius: "8px",
  color: "var(--text-primary)",
  fontSize: "12px",
};

export function ExerciseChartDisplay({
  exercise,
  metric,
  windowWeeks,
  points,
}: ExerciseChartProps) {
  if (!points || points.length === 0) {
    return (
      <DisplayPlaceholder>
        No sessions for <strong>{exercise}</strong> in the last {windowWeeks}{" "}
        weeks.
      </DisplayPlaceholder>
    );
  }

  const dataKey = metric === "max_weight" ? "maxWeightKg" : "est1RMKg";
  const label = metric === "max_weight" ? "Max weight" : "Est. 1RM";

  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-3">
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <div className="text-sm font-medium text-[var(--text-primary)]">
          {exercise}
        </div>
        <div className="text-[11px] uppercase tracking-wide text-[var(--text-muted)]">
          {label} · {windowWeeks}w
        </div>
      </div>
      <div style={{ height: 180 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={points}
            margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
          >
            <XAxis
              dataKey="date"
              tick={{ fill: "var(--text-muted)", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              minTickGap={24}
              tickFormatter={(iso: string) =>
                format(new Date(iso), "MMM d")
              }
            />
            <YAxis
              tick={{ fill: "var(--text-muted)", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={32}
              tickFormatter={(v: number) => `${Math.round(v)}`}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              labelFormatter={(iso: string) =>
                format(new Date(iso), "MMM d, yyyy")
              }
              formatter={(v: number) => [`${v.toFixed(1)} kg`, label]}
            />
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke="var(--accent)"
              strokeWidth={2}
              dot={{ fill: "var(--accent)", r: 3 }}
              activeDot={{ r: 5 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
