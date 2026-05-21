"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { BottomNav } from "@/components/ui/bottom-nav";
import { UploadFab } from "@/components/ui/upload-fab";
import { SidebarNav } from "@/components/layout/sidebar-nav";
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
      <SidebarNav />
      <main className="min-h-dvh pb-24 lg:ml-64 lg:pb-8">{children}</main>
      <BottomNav />
      <UploadFab />
    </div>
  );
}
