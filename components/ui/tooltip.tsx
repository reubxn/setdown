// <Tooltip label="Copy"><IconButton ... /></Tooltip>
"use client";

import {
  useId,
  useState,
  type ReactElement,
  type ReactNode,
  cloneElement,
  type HTMLAttributes,
} from "react";
import { cn } from "./utils";

export interface TooltipProps {
  label: ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  children: ReactElement<HTMLAttributes<HTMLElement>>;
  className?: string;
}

const sideClasses = {
  top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
  bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
  left: "right-full top-1/2 -translate-y-1/2 mr-2",
  right: "left-full top-1/2 -translate-y-1/2 ml-2",
} as const;

export function Tooltip({
  label,
  side = "top",
  children,
  className,
}: TooltipProps) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const child = cloneElement(children, {
    "aria-describedby": open ? id : undefined,
    onMouseEnter: () => setOpen(true),
    onMouseLeave: () => setOpen(false),
    onFocus: () => setOpen(true),
    onBlur: () => setOpen(false),
  } as HTMLAttributes<HTMLElement>);
  return (
    <span className="relative inline-flex">
      {child}
      {open ? (
        <span
          id={id}
          role="tooltip"
          className={cn(
            "absolute z-50 whitespace-nowrap rounded-md bg-[var(--bg-sunken)] border border-[var(--border-strong)] px-2 py-1 text-xs text-[var(--text-primary)] shadow-[var(--shadow-elevated)] pointer-events-none",
            sideClasses[side],
            className,
          )}
        >
          {label}
        </span>
      ) : null}
    </span>
  );
}
