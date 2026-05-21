// internal: rendered by <ToastProvider />; create toasts via useToast().push(...)
"use client";

import { CheckCircle2, AlertTriangle, AlertOctagon, Info, X } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "./utils";

export type ToastVariant = "info" | "success" | "warn" | "danger";

export interface ToastData {
  id: string;
  title?: ReactNode;
  description?: ReactNode;
  variant: ToastVariant;
  duration: number;
}

const variantIcon: Record<ToastVariant, ReactNode> = {
  info: <Info className="h-4 w-4" aria-hidden />,
  success: <CheckCircle2 className="h-4 w-4" aria-hidden />,
  warn: <AlertTriangle className="h-4 w-4" aria-hidden />,
  danger: <AlertOctagon className="h-4 w-4" aria-hidden />,
};

const variantColor: Record<ToastVariant, string> = {
  info: "text-[var(--text-secondary)]",
  success: "text-[var(--success)]",
  warn: "text-[var(--warn)]",
  danger: "text-[var(--danger)]",
};

export function Toast({
  toast,
  onDismiss,
}: {
  toast: ToastData;
  onDismiss: (id: string) => void;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "pointer-events-auto flex items-start gap-3 rounded-md bg-[var(--bg-elevated)] border border-[var(--border-subtle)] shadow-[var(--shadow-elevated)] px-3 py-2.5 min-w-[260px] max-w-sm",
      )}
    >
      <span className={cn("mt-0.5 shrink-0", variantColor[toast.variant])}>
        {variantIcon[toast.variant]}
      </span>
      <div className="flex-1 min-w-0">
        {toast.title ? (
          <div className="text-sm font-medium text-[var(--text-primary)]">
            {toast.title}
          </div>
        ) : null}
        {toast.description ? (
          <div className="text-xs text-[var(--text-muted)] mt-0.5">
            {toast.description}
          </div>
        ) : null}
      </div>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 text-[var(--text-muted)] hover:text-[var(--text-primary)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] rounded"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
