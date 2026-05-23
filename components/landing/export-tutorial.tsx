"use client";

import { useEffect } from "react";
import Image from "next/image";

const steps = [
  {
    src: "/tutorial/step-1.jpg",
    caption: "In Strong, open Settings and tap Export Workouts.",
  },
  {
    src: "/tutorial/step-2.jpg",
    caption: "Tap the blue Export Workouts button.",
  },
  {
    src: "/tutorial/step-3.jpg",
    caption: "Choose Save to Files, then drop the CSV above.",
  },
];

interface ExportTutorialProps {
  open: boolean;
  onClose: () => void;
}

export function ExportTutorial({ open, onClose }: ExportTutorialProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-tutorial-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-2xl rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-base)] p-6 shadow-[var(--shadow-elevated)]">
        <h2
          id="export-tutorial-title"
          className="text-lg font-semibold text-[var(--text-primary)]"
        >
          How to export from Strong
        </h2>
        <ol className="mt-5 grid gap-4 sm:grid-cols-3">
          {steps.map((step, i) => (
            <li
              key={step.src}
              className="rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-3"
            >
              <div className="relative aspect-[9/19] w-full overflow-hidden rounded-[var(--radius-sm)] bg-[var(--bg-sunken)]">
                <Image
                  src={step.src}
                  alt={`Step ${i + 1}`}
                  fill
                  sizes="(min-width: 640px) 200px, 50vw"
                  className="object-contain"
                />
              </div>
              <p className="mt-3 text-xs text-[var(--text-secondary)]">
                <span className="font-medium text-[var(--text-primary)]">
                  {i + 1}.
                </span>{" "}
                {step.caption}
              </p>
            </li>
          ))}
        </ol>

        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-md p-1 text-white/50 hover:bg-white/10 hover:text-white"
          aria-label="Close"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
