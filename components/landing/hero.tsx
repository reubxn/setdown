"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { parseStrongCsv } from "@/lib/parse-strong-csv";
import { useDataset } from "@/context/dataset-context";
import { LoginModal } from "@/components/auth/login-modal";
import { cn } from "@/components/ui/utils";

export function Hero() {
  return (
    <section className="mx-auto grid w-full max-w-[1200px] gap-10 px-6 pt-16 pb-12 lg:grid-cols-2 lg:gap-16 lg:pt-24 lg:pb-20">
      <div className="flex flex-col justify-center">
        <h1 className="text-4xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-5xl lg:text-6xl">
          Everything Strong Premium charges for.{" "}
          <span className="text-[var(--accent)]">Free.</span>
        </h1>
        <p className="mt-5 max-w-xl text-base text-[var(--text-secondary)] sm:text-lg">
          Drop your Strong export. See your numbers. Talk to AI. No signup
          needed to start.
        </p>
      </div>
      <div className="flex flex-col justify-center">
        <HeroDropzone />
      </div>
    </section>
  );
}

// Inline stub of the Dropzone. Track 1.4 will replace this with a shared
// <Dropzone> component used here, on /upload, and in settings.
function HeroDropzone() {
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsing, setParsing] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const { setDataset } = useDataset();
  const router = useRouter();

  const processFile = useCallback(
    async (file: File) => {
      setError(null);
      setParsing(true);
      try {
        const text = await file.text();
        const result = parseStrongCsv(text, file.name);
        if ("error" in result) {
          setError(result.error);
          return;
        }
        await setDataset(result.dataset);
        router.push("/overview");
      } catch {
        setError("Failed to read file. Please try again.");
      } finally {
        setParsing(false);
      }
    },
    [setDataset, router],
  );

  const onPick = useCallback(
    (file: File | undefined) => {
      if (!file) return;
      if (!(file.name.endsWith(".csv") || file.type === "text/csv")) {
        setError("Please upload a CSV file.");
        return;
      }
      processFile(file);
    },
    [processFile],
  );

  return (
    <div className="flex flex-col gap-3">
      <label
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          onPick(e.dataTransfer.files[0]);
        }}
        className={cn(
          "group relative flex min-h-[280px] cursor-pointer flex-col items-center justify-center rounded-[var(--radius-lg)] border-2 border-dashed p-8 text-center transition-colors",
          dragging
            ? "border-[var(--accent)] bg-[var(--accent-muted)]"
            : "border-[var(--border-subtle)] bg-[var(--bg-elevated)] hover:border-[var(--border-strong)]",
        )}
      >
        <input
          type="file"
          accept=".csv,text/csv"
          className="sr-only"
          onChange={(e) => onPick(e.target.files?.[0])}
          disabled={parsing}
        />
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--bg-sunken)] text-[var(--accent)]">
          <Upload className="h-6 w-6" />
        </div>
        <p className="mt-4 text-base font-medium text-[var(--text-primary)]">
          {parsing ? "Parsing your workouts…" : "Drop your Strong CSV"}
        </p>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          or click to choose a file
        </p>
        {error && (
          <p className="mt-3 text-sm text-[var(--danger)]">{error}</p>
        )}
      </label>
      <p className="text-center text-sm text-[var(--text-muted)]">
        or{" "}
        <button
          type="button"
          onClick={() => setLoginOpen(true)}
          className="text-[var(--accent)] hover:underline"
        >
          sign in to save and chat with AI
        </button>
      </p>
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </div>
  );
}
