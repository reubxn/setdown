"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDataset } from "@/context/dataset-context";
import { PrimaryButton } from "@/components/legacy/primary-button";
import { MetricCard } from "@/components/legacy/card";
import { PageShell } from "@/components/layout/page-shell";
import { format } from "date-fns";

export default function SettingsPage() {
  const { dataset, clearData } = useDataset();
  const router = useRouter();

  async function handleClear() {
    if (confirm("Clear all workout data? This cannot be undone.")) {
      await clearData();
      sessionStorage.removeItem("setdown-chat-messages");
      router.replace("/upload");
    }
  }

  return (
    <PageShell title="Settings" subtitle="Data, privacy, and about">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8 max-w-5xl">
        <div className="space-y-6">
          {dataset && (
            <MetricCard>
              <p className="text-sm text-[var(--text-muted)]">Current dataset</p>
              <p className="mt-1 font-medium">{dataset.fileName}</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                {dataset.sessions.length} sessions · {dataset.exercises.length}{" "}
                exercises
              </p>
              <p className="text-xs text-[var(--text-muted)]">
                {format(dataset.dateRange.start, "MMM d, yyyy")} —{" "}
                {format(dataset.dateRange.end, "MMM d, yyyy")}
              </p>
            </MetricCard>
          )}

          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
            <Link href="/upload?replace=1" className="block flex-1">
              <PrimaryButton variant="outline-green" className="w-full">
                Replace CSV
              </PrimaryButton>
            </Link>
            <PrimaryButton
              variant="destructive"
              className="w-full flex-1"
              onClick={handleClear}
            >
              Clear all data
            </PrimaryButton>
          </div>
        </div>

        <div className="space-y-6">
          <MetricCard title="Privacy">
            <p className="text-sm text-white/80 leading-relaxed">
              Your CSV is processed on this device. Only a short summary is sent to
              Claude when you ask a question. Workout data is stored in IndexedDB
              in your browser — not on our servers.
            </p>
          </MetricCard>

          <MetricCard title="About">
            <p className="text-sm text-white/80 leading-relaxed">
              <strong className="text-white">setdown</strong> — side project.
              Visualize your Strong workout export. Not affiliated with Strong.
            </p>
            <p className="mt-2 text-xs text-[var(--text-muted)]">
              Weight units assumed kg (from export). Warm-up sets excluded from
              volume.
            </p>
          </MetricCard>
        </div>
      </div>
    </PageShell>
  );
}
