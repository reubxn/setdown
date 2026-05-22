"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Sidebar } from "@/components/layout/sidebar";
import { useDataset } from "@/context/dataset-context";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { dataset, loading } = useDataset();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !dataset && pathname !== "/upload") {
      router.replace("/upload");
    }
  }, [loading, dataset, pathname, router]);

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[var(--bg-primary)]">
        <p className="text-sm text-[var(--text-muted)]">Loading…</p>
      </div>
    );
  }

  if (!dataset) return null;

  return (
    <div className="min-h-dvh bg-[var(--bg-primary)]">
      <Sidebar />
      <main className="min-h-dvh pb-24 lg:ml-64 lg:pb-8">{children}</main>
      <BottomNav />
    </div>
  );
}
