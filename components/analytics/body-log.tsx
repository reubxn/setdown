// <BodyLog />
"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/context/auth-context";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { colors } from "@/lib/design-tokens";

const tooltipStyle = {
  backgroundColor: colors.bgElevated,
  border: `1px solid ${colors.borderStrong}`,
  borderRadius: 8,
  color: colors.textPrimary,
  fontSize: 12,
};

type Measurement = {
  _id: string;
  date: number;
  weightKg: number | null;
  bodyFatPct: number | null;
  measurements: Record<string, number>;
};

function todayIso(): string {
  return format(new Date(), "yyyy-MM-dd");
}

export function BodyLog() {
  const { isAuthenticated } = useAuth();
  const measurements = useQuery(
    api.queries.getBodyMeasurements.default,
    isAuthenticated ? {} : "skip",
  ) as Measurement[] | undefined;
  const save = useMutation(api.mutations.saveBodyMeasurement.default);

  const [date, setDate] = useState(todayIso());
  const [weight, setWeight] = useState("");
  const [bodyFat, setBodyFat] = useState("");
  const [chest, setChest] = useState("");
  const [waist, setWaist] = useState("");
  const [arm, setArm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const weightSeries = useMemo(() => {
    return (measurements ?? [])
      .filter((m) => m.weightKg != null)
      .map((m) => ({
        date: m.date,
        label: format(new Date(m.date), "MMM d"),
        weight: m.weightKg as number,
        bodyFat: m.bodyFatPct ?? undefined,
      }));
  }, [measurements]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const w = weight.trim() ? Number(weight) : undefined;
    const bf = bodyFat.trim() ? Number(bodyFat) : undefined;
    const custom: Record<string, number> = {};
    if (chest.trim()) custom.chest = Number(chest);
    if (waist.trim()) custom.waist = Number(waist);
    if (arm.trim()) custom.arm = Number(arm);

    if (w === undefined && bf === undefined && Object.keys(custom).length === 0) {
      setError("Fill at least one field.");
      return;
    }
    if (w !== undefined && (Number.isNaN(w) || w <= 0)) {
      setError("Weight must be a positive number.");
      return;
    }
    if (bf !== undefined && (Number.isNaN(bf) || bf < 0 || bf > 100)) {
      setError("Body fat % must be between 0 and 100.");
      return;
    }

    setSubmitting(true);
    try {
      const ts = new Date(date).getTime();
      await save({
        date: ts,
        weightKg: w,
        bodyFatPct: bf,
        measurements: Object.keys(custom).length ? custom : undefined,
      });
      setWeight("");
      setBodyFat("");
      setChest("");
      setWaist("");
      setArm("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid gap-4 @lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
      <Card>
        <CardHeader title="Log a measurement" />
        <CardBody>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3 text-sm">
            <Field label="Date" type="date" value={date} onChange={setDate} />
            <Field
              label="Weight (kg)"
              type="number"
              step="0.1"
              value={weight}
              onChange={setWeight}
              placeholder="e.g. 78.4"
            />
            <Field
              label="Body fat (%)"
              type="number"
              step="0.1"
              value={bodyFat}
              onChange={setBodyFat}
              placeholder="optional"
            />
            <div className="mt-1 text-[11px] font-medium uppercase tracking-wide text-[var(--text-muted)]">
              Optional measurements (cm)
            </div>
            <Field label="Chest" type="number" step="0.1" value={chest} onChange={setChest} />
            <Field label="Waist" type="number" step="0.1" value={waist} onChange={setWaist} />
            <Field label="Arm" type="number" step="0.1" value={arm} onChange={setArm} />
            {error ? (
              <p className="text-xs text-[var(--danger)]">{error}</p>
            ) : null}
            <Button type="submit" loading={submitting}>
              Save measurement
            </Button>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Weight trend"
          subtitle={
            measurements && measurements.length > 0
              ? `${measurements.length} entr${measurements.length === 1 ? "y" : "ies"}`
              : undefined
          }
        />
        <CardBody>
          {weightSeries.length < 2 ? (
            <p className="py-8 text-center text-sm text-[var(--text-muted)]">
              {measurements && measurements.length > 0
                ? "Log another measurement to see a trend."
                : "No measurements yet."}
            </p>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={weightSeries}
                  margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                >
                  <XAxis
                    dataKey="label"
                    tick={{ fill: colors.textMuted, fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    minTickGap={24}
                  />
                  <YAxis
                    tick={{ fill: colors.textMuted, fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    width={36}
                    domain={["auto", "auto"]}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(v: number) => [`${v.toFixed(1)} kg`, "Weight"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="weight"
                    stroke={colors.accent}
                    strokeWidth={2}
                    dot={{ fill: colors.accent, r: 3 }}
                    activeDot={{ r: 5 }}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {measurements && measurements.length > 0 ? (
            <div className="mt-4 max-h-48 overflow-y-auto border-t border-[var(--border-subtle)] pt-3">
              <table className="w-full text-xs tabular-nums">
                <thead className="text-[var(--text-muted)]">
                  <tr className="text-left">
                    <th className="pb-1 pr-2 font-medium">Date</th>
                    <th className="pb-1 pr-2 font-medium">Weight</th>
                    <th className="pb-1 font-medium">BF%</th>
                  </tr>
                </thead>
                <tbody>
                  {[...measurements].reverse().slice(0, 20).map((m) => (
                    <tr key={m._id} className="border-t border-[var(--border-subtle)]/50">
                      <td className="py-1 pr-2 text-[var(--text-secondary)]">
                        {format(new Date(m.date), "MMM d, yyyy")}
                      </td>
                      <td className="py-1 pr-2 text-[var(--text-primary)]">
                        {m.weightKg != null ? `${m.weightKg.toFixed(1)} kg` : "—"}
                      </td>
                      <td className="py-1 text-[var(--text-primary)]">
                        {m.bodyFatPct != null ? `${m.bodyFatPct.toFixed(1)}%` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </CardBody>
      </Card>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  step,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  step?: string;
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-medium uppercase tracking-wide text-[var(--text-muted)]">
        {label}
      </span>
      <input
        type={type}
        step={step}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-sunken)] px-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
      />
    </label>
  );
}
