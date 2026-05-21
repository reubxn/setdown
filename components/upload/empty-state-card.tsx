"use client";

import { Upload } from "lucide-react";

export function EmptyStateCard({
  onFileSelect,
  dragging,
  onDragOver,
  onDragLeave,
  onDrop,
}: {
  onFileSelect: (file: File) => void;
  dragging?: boolean;
  onDragOver?: (e: React.DragEvent) => void;
  onDragLeave?: () => void;
  onDrop?: (e: React.DragEvent) => void;
}) {
  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`rounded-2xl border-2 border-dashed p-10 text-center transition-colors ${
        dragging
          ? "border-[var(--accent-blue)] bg-[var(--accent-blue)]/5"
          : "border-white/20 bg-[var(--card)]"
      }`}
    >
      <Upload
        className="mx-auto mb-4 h-10 w-10 text-[var(--accent-blue)]"
        strokeWidth={1.5}
      />
      <h2 className="text-lg font-semibold text-white">Drop your export</h2>
      <p className="mt-2 text-sm text-[var(--text-muted)]">
        or tap to choose a CSV file
      </p>
      <p className="mt-4 text-xs text-[var(--text-muted)]">
        Strong → Settings → Export data
      </p>
      <label className="mt-6 inline-block cursor-pointer">
        <span className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-black">
          Choose file
        </span>
        <input
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onFileSelect(file);
          }}
        />
      </label>
    </div>
  );
}
