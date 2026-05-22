// <Dropzone size="lg" onFileSelected={handle} /> — sizes: sm, md, lg
"use client";

import { useCallback, useId, useRef, useState, type ReactNode } from "react";
import { UploadCloud } from "lucide-react";
import { cn } from "@/components/ui/utils";

export type DropzoneSize = "sm" | "md" | "lg";

export interface DropzoneProps {
  size?: DropzoneSize;
  disabled?: boolean;
  onFileSelected: (file: File) => void;
  className?: string;
  title?: ReactNode;
  subtitle?: ReactNode;
}

const sizeStyles: Record<DropzoneSize, string> = {
  sm: "p-4 min-h-[96px] text-sm",
  md: "p-8 min-h-[180px] text-sm",
  lg: "p-10 min-h-[260px] text-base",
};

const iconSize: Record<DropzoneSize, string> = {
  sm: "h-5 w-5",
  md: "h-8 w-8",
  lg: "h-10 w-10",
};

const MAX_FILE_BYTES = 10 * 1024 * 1024;

function isCsv(file: File): boolean {
  return (
    file.name.toLowerCase().endsWith(".csv") ||
    file.type === "text/csv" ||
    file.type === "application/vnd.ms-excel"
  );
}

export function Dropzone({
  size = "md",
  disabled = false,
  onFileSelected,
  className,
  title,
  subtitle,
}: DropzoneProps) {
  const [dragging, setDragging] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();

  const handleFile = useCallback(
    (file: File | undefined | null) => {
      if (!file) return;
      if (!isCsv(file)) {
        setLocalError("Please choose a CSV file.");
        return;
      }
      if (file.size > MAX_FILE_BYTES) {
        setLocalError("File too large. Maximum size is 10 MB.");
        return;
      }
      setLocalError(null);
      onFileSelected(file);
    },
    [onFileSelected],
  );

  const defaultTitle =
    size === "sm" ? "Update from new export" : "Drop your Strong export";
  const defaultSubtitle =
    size === "sm"
      ? "click to choose a file"
      : "drag and drop a .csv file, or click to browse";

  return (
    <div className={className}>
      <label
        htmlFor={inputId}
        onDragOver={(e) => {
          if (disabled) return;
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          if (disabled) return;
          e.preventDefault();
          setDragging(false);
          handleFile(e.dataTransfer.files?.[0]);
        }}
        className={cn(
          "flex flex-col items-center justify-center gap-2 rounded-[var(--radius-lg)] border-2 border-dashed text-center transition-colors",
          sizeStyles[size],
          dragging
            ? "border-[var(--accent)] bg-[var(--accent-muted)]"
            : "border-[var(--border-subtle)] bg-[var(--bg-elevated)] hover:border-[var(--border-strong)]",
          disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
        )}
      >
        <UploadCloud
          className={cn(iconSize[size], "text-[var(--text-muted)]")}
          aria-hidden
        />
        <div className="font-medium text-[var(--text-primary)]">
          {title ?? defaultTitle}
        </div>
        <div className="text-xs text-[var(--text-muted)]">
          {subtitle ?? defaultSubtitle}
        </div>
        {localError ? (
          <div className="mt-1 text-xs text-[var(--danger)]">{localError}</div>
        ) : null}
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept=".csv,text/csv"
          className="sr-only"
          disabled={disabled}
          onChange={(e) => {
            handleFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </label>
    </div>
  );
}
