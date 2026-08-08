"use client";

import { useState } from "react";
import Link from "next/link";
import { Settings } from "lucide-react";
import { SettingsSheet } from "@/components/settings/settings-sheet";

export function MobileTopBar() {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-12 items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)]/95 px-4 backdrop-blur-md lg:hidden">
      <Link href="/" className="block">
        <span className="font-display text-xl text-[var(--text-primary)]">
          setdown
        </span>
      </Link>

      <button
        type="button"
        onClick={() => setSettingsOpen(true)}
        className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--text-secondary)] transition-colors hover:bg-white/5 hover:text-[var(--text-primary)]"
        aria-label="Settings"
      >
        <Settings className="h-5 w-5" strokeWidth={1.75} />
      </button>

      <SettingsSheet open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </header>
  );
}
