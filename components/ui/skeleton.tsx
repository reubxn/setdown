// <Skeleton className="h-6 w-32" />
"use client";

import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "./utils";

export const Skeleton = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  function Skeleton({ className, ...rest }, ref) {
    return (
      <div
        ref={ref}
        className={cn(
          "animate-pulse rounded-md bg-[var(--bg-elevated)] border border-[var(--border-subtle)]",
          className,
        )}
        {...rest}
      />
    );
  },
);
