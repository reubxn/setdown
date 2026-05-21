// <SlideOver open={open} onClose={...} title="Chat">...</SlideOver>
"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { IconButton } from "./icon-button";
import { cn } from "./utils";

export interface SlideOverProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  width?: "sm" | "md" | "lg";
  side?: "right" | "left";
  className?: string;
}

const widthClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-xl",
} as const;

export function SlideOver({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  width = "md",
  side = "right",
  className,
}: SlideOverProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descId = useId();
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    previousFocus.current = document.activeElement as HTMLElement | null;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener("keydown", handleKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = window.setTimeout(() => {
      const first = panelRef.current?.querySelector<HTMLElement>(
        'a[href],button:not([disabled]),input:not([disabled]),textarea:not([disabled])',
      );
      first?.focus();
    }, 0);
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = prev;
      window.clearTimeout(t);
      previousFocus.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;
  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[100]" role="presentation">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descId : undefined}
        className={cn(
          "absolute top-0 bottom-0 w-full bg-[var(--bg-elevated)] border-[var(--border-subtle)] shadow-[var(--shadow-elevated)] flex flex-col",
          side === "right"
            ? "right-0 border-l"
            : "left-0 border-r",
          widthClasses[width],
          className,
        )}
      >
        {(title || description) && (
          <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-[var(--border-subtle)]">
            <div className="min-w-0">
              {title ? (
                <h2
                  id={titleId}
                  className="text-base font-semibold text-[var(--text-primary)]"
                >
                  {title}
                </h2>
              ) : null}
              {description ? (
                <p
                  id={descId}
                  className="mt-0.5 text-xs text-[var(--text-muted)]"
                >
                  {description}
                </p>
              ) : null}
            </div>
            <IconButton
              aria-label="Close"
              icon={<X className="h-4 w-4" />}
              size="sm"
              onClick={onClose}
            />
          </div>
        )}
        <div className="flex-1 overflow-y-auto px-5 py-4 text-sm text-[var(--text-secondary)]">
          {children}
        </div>
        {footer ? (
          <div className="border-t border-[var(--border-subtle)] px-5 py-3">
            {footer}
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
