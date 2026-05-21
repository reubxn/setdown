// <Tabs value={tab} onChange={setTab} items={[{value:"a",label:"A"}]} />
"use client";

import {
  useRef,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { cn } from "./utils";

export interface TabItem<T extends string> {
  value: T;
  label: ReactNode;
  disabled?: boolean;
}

export interface TabsProps<T extends string> {
  items: ReadonlyArray<TabItem<T>>;
  value: T;
  onChange: (value: T) => void;
  className?: string;
  "aria-label"?: string;
}

export function Tabs<T extends string>({
  items,
  value,
  onChange,
  className,
  ...rest
}: TabsProps<T>) {
  const listRef = useRef<HTMLDivElement>(null);

  const moveFocus = (delta: number, currentIndex: number) => {
    const enabled = items
      .map((it, i) => ({ it, i }))
      .filter((x) => !x.it.disabled);
    if (!enabled.length) return;
    const pos = enabled.findIndex((x) => x.i === currentIndex);
    const next = enabled[(pos + delta + enabled.length) % enabled.length];
    onChange(next.it.value);
    const btn = listRef.current?.querySelector<HTMLButtonElement>(
      `[data-tab-value="${next.it.value}"]`,
    );
    btn?.focus();
  };

  const handleKey = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      moveFocus(1, index);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      moveFocus(-1, index);
    } else if (e.key === "Home") {
      e.preventDefault();
      moveFocus(-items.length, 0);
    } else if (e.key === "End") {
      e.preventDefault();
      moveFocus(items.length, 0);
    }
  };

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label={rest["aria-label"]}
      className={cn(
        "flex items-center gap-1 overflow-x-auto border-b border-[var(--border-subtle)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className,
      )}
    >
      {items.map((item, i) => {
        const selected = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            data-tab-value={item.value}
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            disabled={item.disabled}
            onClick={() => !item.disabled && onChange(item.value)}
            onKeyDown={(e) => handleKey(e, i)}
            className={cn(
              "relative shrink-0 px-3 h-10 text-sm font-medium transition-colors outline-none focus-visible:text-[var(--text-primary)] disabled:opacity-40 disabled:cursor-not-allowed",
              selected
                ? "text-[var(--text-primary)]"
                : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]",
            )}
          >
            {item.label}
            <span
              aria-hidden
              className={cn(
                "absolute left-2 right-2 -bottom-px h-0.5 rounded-full transition-colors",
                selected ? "bg-[var(--accent)]" : "bg-transparent",
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
