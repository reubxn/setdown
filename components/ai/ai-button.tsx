// <AIButton onClick={open} />
"use client";

import { Sparkles } from "lucide-react";
import { cn } from "@/components/ui/utils";

export interface AIButtonProps {
  onClick: () => void;
  className?: string;
  variant?: "floating" | "inline";
  locked?: boolean;
  label?: string;
}

export function AIButton({
  onClick,
  className,
  variant = "floating",
  locked = false,
  label = "Ask AI",
}: AIButtonProps) {
  if (variant === "inline") {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={locked ? "Sign in to chat with AI" : label}
        className={cn(
          "inline-flex h-10 items-center gap-2 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 text-sm text-[var(--text-primary)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]",
          className,
        )}
      >
        <Sparkles className="h-4 w-4" />
        <span>{label}</span>
        {locked ? (
          <span className="ml-1 text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
            sign in
          </span>
        ) : null}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={locked ? "Sign in to chat with AI" : label}
      className={cn(
        "fixed bottom-24 right-5 z-40 inline-flex h-14 items-center gap-2 rounded-full bg-[var(--accent)] px-5 text-sm font-semibold text-black shadow-[var(--shadow-elevated)] transition-transform hover:scale-[1.03] active:scale-[0.98] lg:bottom-8 lg:right-8",
        className,
      )}
    >
      <Sparkles className="h-5 w-5" />
      <span>{label}</span>
    </button>
  );
}
