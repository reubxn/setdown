"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ReferenceArea } from "recharts";
import type { CategoricalChartState } from "recharts/types/chart/types";
import {
  formatSelectionPercent,
  normalizeRange,
  selectionFromIndices,
  type ChartRangeSelection,
  type SelectionDelta,
  type SelectablePoint,
} from "@/lib/chart-selection";
import { cn } from "@/lib/utils";

export function useChartRangeSelection(dataLength: number) {
  const [selection, setSelection] = useState<ChartRangeSelection | null>(null);
  const [drag, setDrag] = useState<ChartRangeSelection | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragging = useRef(false);
  const anchorIndex = useRef<number | null>(null);
  const dragRange = useRef<ChartRangeSelection | null>(null);

  const clear = useCallback(() => {
    setSelection(null);
    setDrag(null);
    setIsDragging(false);
    dragging.current = false;
    anchorIndex.current = null;
    dragRange.current = null;
  }, []);

  const setDragRange = useCallback((range: ChartRangeSelection | null) => {
    dragRange.current = range;
    setDrag(range);
  }, []);

  const onMouseDown = useCallback(
    (state: CategoricalChartState) => {
      const idx = state?.activeTooltipIndex;
      if (idx == null || idx < 0 || idx >= dataLength) return;
      dragging.current = true;
      setIsDragging(true);
      anchorIndex.current = idx;
      setDragRange(normalizeRange(idx, idx));
      setSelection(null);
    },
    [dataLength, setDragRange]
  );

  const onMouseMove = useCallback(
    (state: CategoricalChartState) => {
      if (!dragging.current || anchorIndex.current == null) return;
      const idx = state?.activeTooltipIndex;
      if (idx == null || idx < 0 || idx >= dataLength) return;
      setDragRange(normalizeRange(anchorIndex.current, idx));
    },
    [dataLength, setDragRange]
  );

  const finalizeDrag = useCallback(() => {
    if (!dragging.current) return;
    dragging.current = false;
    setIsDragging(false);
    anchorIndex.current = null;
    const range = dragRange.current;
    if (range && range.startIndex !== range.endIndex) {
      setSelection(range);
    }
    setDragRange(null);
  }, [setDragRange]);

  // Finalize when the user releases the mouse anywhere on the page — not just
  // inside the chart. Recharts only fires onMouseUp when the release is inside
  // its plot area, so dragging out then releasing would otherwise hang.
  useEffect(() => {
    if (!isDragging) return;
    const handle = () => finalizeDrag();
    window.addEventListener("mouseup", handle);
    window.addEventListener("pointerup", handle);
    return () => {
      window.removeEventListener("mouseup", handle);
      window.removeEventListener("pointerup", handle);
    };
  }, [isDragging, finalizeDrag]);

  const activeRange = drag ?? selection;

  return {
    selection,
    activeRange,
    isDragging,
    clear,
    chartHandlers: {
      onMouseDown,
      onMouseMove,
      onMouseUp: finalizeDrag,
    },
  };
}

export function ChartReferenceArea({
  data,
  range,
}: {
  data: { id: string }[];
  range: ChartRangeSelection | null;
}) {
  if (!range || data.length === 0) return null;
  const start = data[range.startIndex];
  const end = data[range.endIndex];
  if (!start || !end) return null;

  return (
    <ReferenceArea
      x1={start.id}
      x2={end.id}
      stroke="#00C2FF"
      strokeOpacity={0.5}
      fill="#00C2FF"
      fillOpacity={0.12}
      ifOverflow="extendDomain"
    />
  );
}

export function ChartSelectionSummary({
  delta,
  formatValue,
  valueLabel,
  onClear,
  className,
}: {
  delta: SelectionDelta;
  formatValue: (n: number) => string;
  valueLabel: string;
  onClear: () => void;
  className?: string;
}) {
  const dirColor =
    delta.direction === "up"
      ? "text-[var(--accent-green)]"
      : delta.direction === "down"
        ? "text-[#FF6B6B]"
        : "text-[var(--text-muted)]";

  const arrow =
    delta.direction === "up" ? "▲" : delta.direction === "down" ? "▼" : "—";

  return (
    <div
      className={cn(
        "pointer-events-auto inline-flex max-w-full items-center gap-1.5 rounded-md border border-white/10 bg-black/70 px-2 py-1 text-[10px] leading-tight whitespace-nowrap backdrop-blur-sm",
        className
      )}
    >
      <span className={cn("tabular-nums font-medium", dirColor)}>
        {arrow} {formatSelectionPercent(delta.percentChange)}
      </span>
      <span className="text-white/80 tabular-nums">
        {formatValue(delta.startValue)} → {formatValue(delta.endValue)}
        {valueLabel ? ` ${valueLabel}` : ""}
      </span>
      <span className="hidden sm:inline text-[var(--text-muted)]/80">
        · {delta.startLabel} → {delta.endLabel}
      </span>
      <button
        type="button"
        onClick={onClear}
        aria-label="Clear selection"
        className="ml-0.5 px-0.5 text-[var(--text-muted)] hover:text-white"
      >
        ×
      </button>
    </div>
  );
}

export function SelectableChartFrame({
  data,
  formatValue,
  valueLabel,
  children,
}: {
  data: SelectablePoint[];
  formatValue: (n: number) => string;
  valueLabel: string;
  children: (ctx: {
    chartHandlers: ReturnType<typeof useChartRangeSelection>["chartHandlers"];
    activeRange: ChartRangeSelection | null;
    referenceArea: React.ReactNode;
  }) => React.ReactNode;
}) {
  const { selection, activeRange, isDragging, clear, chartHandlers } =
    useChartRangeSelection(data.length);

  const dataKey = data.map((d) => d.id).join("|");

  useEffect(() => {
    clear();
  }, [dataKey, clear]);

  const delta = useMemo(() => {
    if (!selection) return null;
    return selectionFromIndices(data, selection.startIndex, selection.endIndex);
  }, [data, selection]);

  return (
    <div
      className={cn(
        "chart-plot relative w-full",
        isDragging && "select-none cursor-ew-resize [&_*]:!cursor-ew-resize"
      )}
      style={isDragging ? { WebkitUserSelect: "none", userSelect: "none" } : undefined}
    >
      {children({
        chartHandlers,
        activeRange,
        referenceArea: <ChartReferenceArea data={data} range={activeRange} />,
      })}
      {delta && (
        <div className="pointer-events-none absolute left-2 top-2 z-10 flex max-w-[calc(100%-1rem)]">
          <ChartSelectionSummary
            delta={delta}
            formatValue={formatValue}
            valueLabel={valueLabel}
            onClear={clear}
          />
        </div>
      )}
    </div>
  );
}
