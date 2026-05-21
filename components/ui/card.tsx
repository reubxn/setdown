// <Card><CardHeader title="Volume" /><CardBody>...</CardBody></Card>
"use client";

import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "./utils";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
}

const paddingClasses = {
  none: "",
  sm: "p-3",
  md: "p-5",
  lg: "p-6",
} as const;

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { className, interactive = false, padding = "md", children, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        "@container rounded-[var(--radius-md)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] shadow-[var(--shadow-card)]",
        interactive &&
          "transition-colors hover:border-[var(--border-strong)] cursor-pointer",
        paddingClasses[padding],
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
});

export function CardHeader({
  title,
  subtitle,
  action,
  className,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-3 mb-3",
        className,
      )}
    >
      <div className="min-w-0">
        <div className="text-sm font-medium text-[var(--text-primary)] truncate">
          {title}
        </div>
        {subtitle ? (
          <div className="text-xs text-[var(--text-muted)] mt-0.5">
            {subtitle}
          </div>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function CardBody({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return <div className={cn("text-sm", className)}>{children}</div>;
}

export function CardFooter({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "mt-4 pt-3 border-t border-[var(--border-subtle)] text-xs text-[var(--text-muted)]",
        className,
      )}
    >
      {children}
    </div>
  );
}
