"use client";

import Link from "next/link";
import { Plus } from "lucide-react";

export function UploadFab() {
  return (
    <Link
      href="/upload?replace=1"
      className="fixed bottom-20 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-white text-black shadow-lg transition-transform hover:scale-105 active:scale-95 lg:hidden"
      aria-label="Upload new CSV"
    >
      <Plus className="h-6 w-6" strokeWidth={2} />
    </Link>
  );
}
