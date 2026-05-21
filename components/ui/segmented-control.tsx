// <SegmentedControl options={[{value:"w",label:"Week"}]} value={v} onChange={setV} />
"use client";

import { useId, type ReactNode } from "react";
import { cn } from "./utils";

export interface SegmentedOption<T extends string> {
  value: T;
  label: ReactNode;
}

export interface SegmentedControlProps<T extends string> {
  options: ReadonlyArray<SegmentedOption<T>>;
  value: T;
  onChange: (value: T) => void;
  size?: "sm" | "md";
  className?: string;
  "aria-label"?: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  size = "md",
  className,
  ...rest
}: SegmentedControlProps<T>) {
  const groupId = useId();
  const sizeClass =
    size === "sm" ? "h-8 text-xs px-2.5" : "h-9 text-sm px-3";
  return (
    <div
      role="radiogroup"
      aria-label={rest["aria-label"]}
      className={cn(
        "inline-flex items-center rounded-md bg-[var(--bg-sunken)] border border-[var(--border-subtle)] p-0.5 gap-0.5",
        className,
      )}
    >
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <button
            key={opt.value}
            id={`${groupId}-${opt.value}`}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(opt.value)}
            className={cn(
              "inline-flex items-center justify-center rounded-[5px] font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]",
              sizeClass,
              selected
                ? "bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-[0_1px_2px_rgba(0,0,0,0.4)]"
                : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
