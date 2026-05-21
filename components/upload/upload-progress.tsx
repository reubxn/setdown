// <UploadProgress stage="parsing" rowCount={1200} />
"use client";

import { Check, Loader2 } from "lucide-react";
import { cn } from "@/components/ui/utils";
import type { UploadStage } from "@/lib/upload-orchestrator";

const STEPS: { key: UploadStage; label: string }[] = [
  { key: "reading", label: "Reading file" },
  { key: "parsing", label: "Parsing CSV" },
  { key: "validating", label: "Validating data" },
  { key: "saving", label: "Saving" },
];

const ORDER: Record<UploadStage, number> = {
  idle: -1,
  reading: 0,
  parsing: 1,
  validating: 2,
  saving: 3,
  done: 4,
  error: -1,
};

export interface UploadProgressProps {
  stage: UploadStage;
  rowCount?: number;
  error?: string;
  className?: string;
}

export function UploadProgress({
  stage,
  rowCount,
  error,
  className,
}: UploadProgressProps) {
  const current = ORDER[stage];
  return (
    <div
      className={cn(
        "rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-5",
        className,
      )}
    >
      <ul className="flex flex-col gap-2">
        {STEPS.map((step, idx) => {
          const done = idx < current || stage === "done";
          const active = idx === current && stage !== "done";
          return (
            <li
              key={step.key}
              className={cn(
                "flex items-center gap-3 text-sm",
                done || active
                  ? "text-[var(--text-primary)]"
                  : "text-[var(--text-muted)]",
              )}
            >
              <span
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-full border",
                  done
                    ? "border-[var(--accent)] bg-[var(--accent)] text-black"
                    : active
                      ? "border-[var(--accent)] text-[var(--accent)]"
                      : "border-[var(--border-subtle)]",
                )}
              >
                {done ? (
                  <Check className="h-3 w-3" />
                ) : active ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-current opacity-50" />
                )}
              </span>
              <span>{step.label}</span>
              {step.key === "saving" && rowCount ? (
                <span className="ml-auto text-xs text-[var(--text-muted)] tabular-nums">
                  {rowCount.toLocaleString()} rows
                </span>
              ) : null}
            </li>
          );
        })}
      </ul>
      {error ? (
        <div className="mt-4 rounded-md border border-[var(--danger)]/40 bg-[var(--danger)]/10 px-3 py-2 text-xs text-[var(--danger)]">
          {error}
        </div>
      ) : null}
    </div>
  );
}
