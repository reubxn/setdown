"use client";

import { useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ChartPoint, ExerciseChartPoint } from "@/lib/chart-series";
import type { SelectablePoint } from "@/lib/chart-selection";
import { SelectableChartFrame } from "./chart-range-select";
import {
  DEFAULT_PROJECTION_DAYS,
  linearFit,
  MIN_TREND_POINTS,
  predictAt,
  type RegressionFit,
} from "@/lib/regression";
export type { RegressionFit } from "@/lib/regression";

const tooltipStyle = {
  backgroundColor: "#1a2128",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "8px",
  color: "#fff",
  fontSize: "12px",
};

function hasValues(data: { value?: number; maxWeight?: number; volume?: number }[]) {
  return data.some(
    (d) =>
      (d.value ?? 0) > 0 ||
      (d.maxWeight ?? 0) > 0 ||
      (d.volume ?? 0) > 0
  );
}

function toSelectable(data: ChartPoint[]): SelectablePoint[] {
  return data.map((d) => ({
    id: d.id,
    label: d.label,
    value: d.value,
    periodStart: d.periodStart,
    periodEnd: d.periodEnd,
  }));
}

function axisTickFormatter(data: ChartPoint[]) {
  const byId = new Map(data.map((d) => [d.id, d.label]));
  return (id: string) => byId.get(id) ?? id;
}

const chartMargin = { top: 8, right: 8, left: 0, bottom: 0 };

export function VolumeAreaChart({
  data,
  chartId = "volume",
}: {
  data: ChartPoint[];
  chartId?: string;
}) {
  if (!hasValues(data)) return null;
  const selectable = toSelectable(data);
  const tickFmt = axisTickFormatter(data);

  return (
    <SelectableChartFrame
      data={selectable}
      formatValue={(v) => `${Math.round(v).toLocaleString()} kg·reps`}
      valueLabel=""
    >
      {({ chartHandlers, referenceArea }) => (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={chartMargin}
            {...chartHandlers}
          >
            <defs>
              <linearGradient id={`${chartId}-grad`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00C2FF" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#00C2FF" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="id"
              tick={{ fill: "#7D8B9A", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
              minTickGap={24}
              tickFormatter={tickFmt}
            />
            <YAxis
              tick={{ fill: "#7D8B9A", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={36}
              tickFormatter={(v) =>
                v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
              }
            />
            <Tooltip
              contentStyle={tooltipStyle}
              labelFormatter={(_, payload) =>
                payload?.[0]?.payload?.label ?? ""
              }
              formatter={(v: number) => [
                `${Math.round(v).toLocaleString()} kg·reps`,
                "Volume",
              ]}
            />
            {referenceArea}
            <Area
              type="monotone"
              dataKey="value"
              stroke="#00C2FF"
              strokeWidth={2}
              fill={`url(#${chartId}-grad)`}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </SelectableChartFrame>
  );
}

export function SessionBarChart({ data }: { data: ChartPoint[] }) {
  if (!hasValues(data)) return null;
  const selectable = toSelectable(data);
  const tickFmt = axisTickFormatter(data);

  return (
    <SelectableChartFrame
      data={selectable}
      formatValue={(v) => String(Math.round(v))}
      valueLabel="sessions"
    >
      {({ chartHandlers, referenceArea }) => (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={chartMargin} {...chartHandlers}>
            <XAxis
              dataKey="id"
              tick={{ fill: "#7D8B9A", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
              minTickGap={24}
              tickFormatter={tickFmt}
            />
            <YAxis
              tick={{ fill: "#7D8B9A", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={28}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              labelFormatter={(_, payload) =>
                payload?.[0]?.payload?.label ?? ""
              }
              formatter={(v: number) => [v, "Sessions"]}
            />
            {referenceArea}
            <Bar dataKey="value" fill="#2A3540" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </SelectableChartFrame>
  );
}

export function DurationLineChart({ data }: { data: ChartPoint[] }) {
  if (!hasValues(data)) return null;
  const selectable = toSelectable(data);
  const tickFmt = axisTickFormatter(data);

  return (
    <SelectableChartFrame
      data={selectable}
      formatValue={(v) => `${Math.round(v)} min`}
      valueLabel=""
    >
      {({ chartHandlers, referenceArea }) => (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={chartMargin} {...chartHandlers}>
            <XAxis
              dataKey="id"
              tick={{ fill: "#7D8B9A", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
              minTickGap={24}
              tickFormatter={tickFmt}
            />
            <YAxis
              tick={{ fill: "#7D8B9A", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={32}
              tickFormatter={(v) => `${v}m`}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              labelFormatter={(_, payload) =>
                payload?.[0]?.payload?.label ?? ""
              }
              formatter={(v: number) => [`${v} min`, "Avg duration"]}
            />
            {referenceArea}
            <Line
              type="monotone"
              dataKey="value"
              stroke="#1d4ed8"
              strokeWidth={2}
              dot={{ fill: "#1d4ed8", r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </SelectableChartFrame>
  );
}

export function exerciseFit(
  data: ExerciseChartPoint[],
  dataKey: keyof Pick<ExerciseChartPoint, "maxWeight" | "volume" | "est1RM">
): RegressionFit | null {
  const points = data
    .map((d) => ({ date: d.id, value: d[dataKey] }))
    .filter((p) => p.value > 0);
  if (points.length < MIN_TREND_POINTS) return null;
  return linearFit(points);
}

interface ExerciseChartRow extends Partial<ExerciseChartPoint> {
  id: string;
  label: string;
  date: string;
  trend?: number;
  projection?: number;
  isProjection?: boolean;
}

function addDaysIso(iso: string, days: number): string {
  return new Date(new Date(iso).getTime() + days * 86_400_000).toISOString();
}

function buildExerciseChartRows(
  data: ExerciseChartPoint[],
  dataKey: keyof Pick<ExerciseChartPoint, "maxWeight" | "volume" | "est1RM">,
  fit: RegressionFit | null,
  projectionDays: number
): ExerciseChartRow[] {
  const rows: ExerciseChartRow[] = data.map((d) => ({
    ...d,
    trend: fit ? predictAt(fit, d.id) : undefined,
  }));

  if (!fit || projectionDays <= 0 || data.length === 0) return rows;

  // Anchor the projection line at the last actual point so it connects.
  const last = rows[rows.length - 1];
  last.projection = last.trend;

  const lastIso = data[data.length - 1].id;
  // 4 evenly spaced steps across the projection horizon.
  const steps = 4;
  for (let i = 1; i <= steps; i++) {
    const days = Math.round((projectionDays * i) / steps);
    const iso = addDaysIso(lastIso, days);
    rows.push({
      id: iso,
      label: "",
      date: `+${days}d projection`,
      isProjection: true,
      projection: predictAt(fit, iso),
    });
  }
  return rows;
}

export function ExerciseLineChart({
  data,
  dataKey,
  label,
  color = "#00C2FF",
  showProjection: showProjectionProp,
}: {
  data: ExerciseChartPoint[];
  dataKey: keyof Pick<ExerciseChartPoint, "maxWeight" | "volume" | "est1RM">;
  label: string;
  color?: string;
  /** Controlled override; if omitted, the chart manages its own toggle. */
  showProjection?: boolean;
}) {
  const [internalShowProjection, setInternalShowProjection] = useState(false);
  const showProjection = showProjectionProp ?? internalShowProjection;

  if (!hasValues(data)) return null;

  const fit = exerciseFit(data, dataKey);

  const rows = buildExerciseChartRows(
    data,
    dataKey,
    fit,
    showProjection && fit ? DEFAULT_PROJECTION_DAYS : 0
  );

  // Selection only operates over actual data points, not the projection tail.
  const selectable: SelectablePoint[] = data.map((d) => ({
    id: d.id,
    label: d.label,
    value: d[dataKey],
    periodStart: d.periodStart,
    periodEnd: d.periodEnd,
  }));
  const tickFmt = axisTickFormatter(
    rows.map((d) => ({
      id: d.id,
      label: d.isProjection ? "" : d.label,
      date: d.date,
      value: 0,
    }))
  );

  return (
    <div className="flex w-full flex-col gap-2">
      {fit && showProjectionProp === undefined && (
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => setInternalShowProjection((v) => !v)}
            className={`rounded-md border px-2 py-1 text-[10px] font-medium tracking-wide transition-colors ${
              showProjection
                ? "border-white/20 bg-white/10 text-white"
                : "border-white/10 text-[var(--text-muted)] hover:text-white"
            }`}
            aria-pressed={showProjection}
          >
            Project 6 wk
          </button>
        </div>
      )}
      <SelectableChartFrame
        data={selectable}
        formatValue={(v) => v.toFixed(1)}
        valueLabel={label}
      >
        {({ chartHandlers, referenceArea }) => (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={rows} margin={chartMargin} {...chartHandlers}>
              <XAxis
                dataKey="id"
                tick={{ fill: "#7D8B9A", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
                minTickGap={20}
                tickFormatter={tickFmt}
              />
              <YAxis
                tick={{ fill: "#7D8B9A", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={36}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: number, name: string) => {
                  if (name === "Trend") return [`${v.toFixed(1)}`, "Trend"];
                  if (name === "Projection")
                    return [`${v.toFixed(1)}`, "Projection"];
                  return [`${v.toFixed(1)}`, label];
                }}
                labelFormatter={(_, payload) =>
                  payload?.[0]?.payload?.date ?? ""
                }
              />
              {referenceArea}
              <Line
                type="monotone"
                dataKey={dataKey}
                name={label}
                stroke={color}
                strokeWidth={2}
                dot={{ fill: color, r: 4 }}
                activeDot={{ r: 6 }}
                connectNulls={false}
                isAnimationActive={false}
              />
              {fit && (
                <Line
                  type="linear"
                  dataKey="trend"
                  name="Trend"
                  stroke={color}
                  strokeOpacity={0.55}
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  dot={false}
                  activeDot={false}
                  isAnimationActive={false}
                />
              )}
              {fit && showProjection && (
                <Line
                  type="linear"
                  dataKey="projection"
                  name="Projection"
                  stroke={color}
                  strokeOpacity={0.4}
                  strokeWidth={1.5}
                  strokeDasharray="2 5"
                  dot={false}
                  activeDot={false}
                  isAnimationActive={false}
                  connectNulls
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        )}
      </SelectableChartFrame>
      {fit && showProjection && (
        <p className="text-[10px] text-[var(--text-muted)] italic">
          Linear extrapolation — not a training plan.
        </p>
      )}
    </div>
  );
}

export function TopExercisesBarChart({ data }: { data: ChartPoint[] }) {
  if (!hasValues(data)) return null;

  return (
    <ResponsiveContainer
      width="100%"
      height={Math.max(200, data.length * 40)}
    >
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 8, left: 4, bottom: 4 }}
      >
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="label"
          tick={{ fill: "#7D8B9A", fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          width={120}
          className="lg:[&_text]:text-xs"
        />
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(v: number) => [
            `${Math.round(v).toLocaleString()} kg·reps`,
            "Volume",
          ]}
        />
        <Bar dataKey="value" fill="#00C2FF" radius={[0, 4, 4, 0]} barSize={14} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/** @deprecated use VolumeAreaChart */
export function WeeklyVolumeChart({
  data,
}: {
  data: { week: string; volume: number }[];
}) {
  return (
    <VolumeAreaChart
      data={data.map((d, i) => ({
        id: `week-${i}`,
        label: d.week,
        date: d.week,
        value: d.volume,
      }))}
    />
  );
}
