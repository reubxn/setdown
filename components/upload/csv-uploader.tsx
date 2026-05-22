"use client";

import { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { EmptyStateCard } from "./empty-state-card";
import { parseStrongCsv } from "@/lib/parse-strong-csv";
import { useDataset } from "@/context/dataset-context";

const MAX_FILE_BYTES = 10 * 1024 * 1024;

export function CsvUploader() {
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsing, setParsing] = useState(false);
  const { setDataset } = useDataset();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isReplace = searchParams.get("replace") === "1";

  const processFile = useCallback(
    async (file: File) => {
      setError(null);
      if (file.size > MAX_FILE_BYTES) {
        setError("File too large. Maximum size is 10 MB.");
        return;
      }
      setParsing(true);
      try {
        const text = await file.text();
        const result = parseStrongCsv(text, file.name);
        if ("error" in result) {
          setError(result.error);
          return;
        }
        if (
          isReplace &&
          !confirm(
            "Catch up with your latest export? We'll update your workouts from this file."
          )
        ) {
          return;
        }
        await setDataset(result.dataset);
        router.replace("/overview");
      } catch {
        setError("Failed to read file. Please try again.");
      } finally {
        setParsing(false);
      }
    },
    [setDataset, router, isReplace]
  );

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col justify-center px-4 py-8 sm:px-8 lg:max-w-4xl lg:py-16">
      <div className="mb-8 text-center lg:mb-12">
        <h1 className="text-2xl font-bold tracking-tight lg:text-4xl">setdown</h1>
        <p className="mt-2 text-sm text-[var(--text-muted)] lg:text-lg">
          drop your Strong export, see your numbers
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-[var(--accent-red)]/50 bg-[var(--accent-red)]/10 p-4 text-sm text-[var(--accent-red)]">
          {error}
        </div>
      )}

      {parsing ? (
        <div className="rounded-2xl bg-[var(--card)] p-10 text-center">
          <p className="text-sm text-[var(--text-muted)]">Parsing your workouts…</p>
        </div>
      ) : (
        <EmptyStateCard
          dragging={dragging}
          onFileSelect={processFile}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const file = e.dataTransfer.files[0];
            if (file?.name.endsWith(".csv") || file?.type === "text/csv") {
              processFile(file);
            } else {
              setError("Please upload a CSV file.");
            }
          }}
        />
      )}
    </div>
  );
}
