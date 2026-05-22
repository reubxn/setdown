// <EmptyState icon={Inbox} title="No data yet" description="..." action={<Button>...</Button>} />
"use client";

import { type ComponentType, type ReactNode } from "react";
import { cn } from "./utils";

export interface EmptyStateProps {
  icon?: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  children?: ReactNode;
  className?: string;
  align?: "center" | "start";
  size?: "sm" | "md" | "lg";
}

const sizeStyles = {
  sm: "p-6",
  md: "p-8",
  lg: "p-10",
} as const;

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  children,
  className,
  align = "center",
  size = "md",
}: EmptyStateProps) {
  const isCenter = align === "center";
  return (
    <div
      className={cn(
        "rounded-[var(--radius-md)] border border-dashed border-[var(--border-subtle)] bg-[var(--bg-elevated)]",
        sizeStyles[size],
        isCenter && "flex flex-col items-center text-center",
        className,
      )}
    >
      {Icon ? (
        <div
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-full bg-[var(--bg-sunken)] text-[var(--accent)]",
            isCenter ? "" : "mb-4",
          )}
        >
          <Icon className="h-5 w-5" aria-hidden />
        </div>
      ) : null}
      <h2
        className={cn(
          "text-base font-semibold text-[var(--text-primary)]",
          Icon && isCenter ? "mt-4" : "",
        )}
      >
        {title}
      </h2>
      {description ? (
        <p
          className={cn(
            "mt-1 max-w-md text-sm text-[var(--text-muted)]",
            isCenter && "mx-auto",
          )}
        >
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
      {children ? <div className="mt-5 w-full">{children}</div> : null}
    </div>
  );
}
