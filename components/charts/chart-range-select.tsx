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
  const dragging = useRef(false);
  const anchorIndex = useRef<number | null>(null);
  const dragRange = useRef<ChartRangeSelection | null>(null);

  const clear = useCallback(() => {
    setSelection(null);
    setDrag(null);
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
    anchorIndex.current = null;
    if (dragRange.current) setSelection(dragRange.current);
    setDragRange(null);
  }, [setDragRange]);

  const onMouseUp = useCallback(() => {
    finalizeDrag();
  }, [finalizeDrag]);

  const onMouseLeave = useCallback(() => {
    finalizeDrag();
  }, [finalizeDrag]);

  const activeRange = drag ?? selection;

  return {
    selection,
    activeRange,
    clear,
    chartHandlers: {
      onMouseDown,
      onMouseMove,
      onMouseUp,
      onMouseLeave,
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
      ? "text-[var(--accent)]"
      : delta.direction === "down"
        ? "text-[#FF6B6B]"
        : "text-[var(--text-muted)]";

  const arrow =
    delta.direction === "up" ? "▲" : delta.direction === "down" ? "▼" : "—";

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-black/50 px-2.5 py-2 backdrop-blur-sm",
        className
      )}
    >
      <div className="min-w-0 text-[10px] leading-snug">
        <p className="text-[var(--text-muted)] truncate">
          {delta.startLabel} → {delta.endLabel}
        </p>
        <p className="mt-0.5 tabular-nums text-white">
          <span className={dirColor}>
            {arrow} {formatSelectionPercent(delta.percentChange)}
          </span>
          <span className="text-[var(--text-muted)]">
            {" "}
            · {formatValue(delta.startValue)} → {formatValue(delta.endValue)}{" "}
            {valueLabel}
          </span>
        </p>
      </div>
      <button
        type="button"
        onClick={onClear}
        className="shrink-0 text-[10px] font-medium text-[var(--text-muted)] hover:text-white"
      >
        Clear
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
  const { selection, activeRange, clear, chartHandlers } =
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
    <div className="flex w-full flex-col">
      <div className="chart-plot relative w-full">
        {children({
          chartHandlers,
          activeRange,
          referenceArea: (
            <ChartReferenceArea data={data} range={activeRange} />
          ),
        })}
        {!selection && (
          <p className="pointer-events-none absolute bottom-1 left-0 right-0 text-center text-[9px] text-[var(--text-muted)]/80">
            Drag on chart to compare a period
          </p>
        )}
      </div>
      {delta && (
        <ChartSelectionSummary
          delta={delta}
          formatValue={formatValue}
          valueLabel={valueLabel}
          onClear={clear}
          className="mt-2"
        />
      )}
    </div>
  );
}
