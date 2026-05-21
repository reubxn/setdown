const MS_PER_DAY = 86_400_000;
const DAYS_PER_MONTH = 30.4375;

export interface RegressionPoint {
  /** ISO date string (or anything `new Date()` accepts). */
  date: string;
  value: number;
}

export interface RegressionFit {
  /** Slope in `value units per day`. */
  slopePerDay: number;
  /** Intercept at day 0 (first point). */
  intercept: number;
  /** Pearson R² in [0, 1]. */
  r2: number;
  /** Days since first point for each input. */
  xDays: number[];
  /** Day 0 timestamp (ms) for projecting forward. */
  baseMs: number;
  /** Slope in value units per 30.4375 days (≈ a calendar month). */
  slopePerMonth: number;
}

/**
 * Ordinary least-squares fit against calendar time (days since first point).
 * Returns null if there are fewer than 2 distinct x values.
 */
export function linearFit(points: RegressionPoint[]): RegressionFit | null {
  if (points.length < 2) return null;

  const sorted = [...points].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  const baseMs = new Date(sorted[0].date).getTime();
  const xDays = sorted.map((p) => (new Date(p.date).getTime() - baseMs) / MS_PER_DAY);
  const ys = sorted.map((p) => p.value);

  const n = xDays.length;
  const meanX = xDays.reduce((s, v) => s + v, 0) / n;
  const meanY = ys.reduce((s, v) => s + v, 0) / n;

  let num = 0;
  let denX = 0;
  let denY = 0;
  for (let i = 0; i < n; i++) {
    const dx = xDays[i] - meanX;
    const dy = ys[i] - meanY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }

  if (denX === 0) return null;

  const slopePerDay = num / denX;
  const intercept = meanY - slopePerDay * meanX;
  const r2 = denY === 0 ? 1 : (num * num) / (denX * denY);

  return {
    slopePerDay,
    intercept,
    r2,
    xDays,
    baseMs,
    slopePerMonth: slopePerDay * DAYS_PER_MONTH,
  };
}

export function predictAt(fit: RegressionFit, isoDate: string): number {
  const days = (new Date(isoDate).getTime() - fit.baseMs) / MS_PER_DAY;
  return fit.intercept + fit.slopePerDay * days;
}

/**
 * Format slope as a human-readable per-month rate, e.g. "+1.2 kg/month".
 * Returns null for fits where the slope is effectively zero or R² is too low to mention.
 */
export function formatSlopePerMonth(
  fit: RegressionFit,
  unit: string,
  opts: { minR2?: number } = {}
): string | null {
  const minR2 = opts.minR2 ?? 0;
  if (fit.r2 < minR2) return null;
  const slope = fit.slopePerMonth;
  if (!Number.isFinite(slope) || Math.abs(slope) < 0.05) return null;
  const sign = slope > 0 ? "+" : "−";
  return `${sign}${Math.abs(slope).toFixed(1)} ${unit}/month`;
}

/** Minimum points we require before drawing a trend line. */
export const MIN_TREND_POINTS = 5;

/** Default forward projection horizon, in days. */
export const DEFAULT_PROJECTION_DAYS = 42; // 6 weeks
