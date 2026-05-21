// <Badge variant="accent">PR</Badge>
"use client";

import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "./utils";

type Variant = "accent" | "muted" | "danger" | "success" | "warn";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: Variant;
}

const variantClasses: Record<Variant, string> = {
  accent: "bg-[var(--accent-muted)] text-[var(--accent)]",
  muted:
    "bg-[var(--bg-sunken)] text-[var(--text-secondary)] border border-[var(--border-subtle)]",
  danger: "bg-[var(--danger)]/15 text-[var(--danger)]",
  success: "bg-[var(--success)]/15 text-[var(--success)]",
  warn: "bg-[var(--warn)]/15 text-[var(--warn)]",
};

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  { className, variant = "muted", children, ...rest },
  ref,
) {
  return (
    <span
      ref={ref}
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium tracking-wide uppercase",
        variantClasses[variant],
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  );
});
