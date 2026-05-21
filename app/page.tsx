"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDataset } from "@/context/dataset-context";

export default function HomePage() {
  const { dataset, loading } = useDataset();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    router.replace(dataset ? "/overview" : "/upload");
  }, [dataset, loading, router]);

  return (
    <div className="flex min-h-dvh items-center justify-center">
      <p className="text-sm text-[var(--text-muted)]">Loading…</p>
    </div>
  );
}
