export interface SelectablePoint {
  id: string;
  label: string;
  value: number;
  /** ISO date for range label */
  periodStart?: string;
  periodEnd?: string;
}

export interface ChartRangeSelection {
  startIndex: number;
  endIndex: number;
}

export interface SelectionDelta {
  startLabel: string;
  endLabel: string;
  startValue: number;
  endValue: number;
  absoluteChange: number;
  percentChange: number | null;
  direction: "up" | "down" | "flat";
}

export function normalizeRange(
  a: number,
  b: number
): ChartRangeSelection {
  return {
    startIndex: Math.min(a, b),
    endIndex: Math.max(a, b),
  };
}

export function selectionFromIndices(
  data: SelectablePoint[],
  startIndex: number,
  endIndex: number
): SelectionDelta | null {
  if (data.length === 0) return null;
  const { startIndex: lo, endIndex: hi } = normalizeRange(startIndex, endIndex);
  const start = data[lo];
  const end = data[hi];
  if (!start || !end) return null;

  const startValue = start.value;
  const endValue = end.value;
  const absoluteChange = endValue - startValue;
  const percentChange =
    startValue !== 0
      ? (absoluteChange / startValue) * 100
      : endValue !== 0
        ? null
        : 0;

  let direction: SelectionDelta["direction"] = "flat";
  if (absoluteChange > 0) direction = "up";
  else if (absoluteChange < 0) direction = "down";

  const periodLabel = (p: SelectablePoint) => {
    if (p.periodStart && p.periodEnd && p.periodStart !== p.periodEnd) {
      return `${formatShortDate(p.periodStart)} – ${formatShortDate(p.periodEnd)}`;
    }
    if (p.periodStart) return formatShortDate(p.periodStart);
    return p.label;
  };

  return {
    startLabel: periodLabel(start),
    endLabel: periodLabel(end),
    startValue,
    endValue,
    absoluteChange,
    percentChange,
    direction,
  };
}

function formatShortDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function formatSelectionPercent(pct: number | null): string {
  if (pct === null) return "—";
  const rounded = Math.abs(pct) < 10 ? pct.toFixed(1) : String(Math.round(pct));
  return `${pct > 0 ? "+" : ""}${rounded}%`;
}
