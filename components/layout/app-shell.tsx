"use client";

import { Sidebar } from "./sidebar";
import { BottomNav } from "./bottom-nav";
import { MobileTopBar } from "./mobile-top-bar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-[var(--bg-base)]">
      <Sidebar />
      <div className="flex min-h-dvh flex-col lg:ml-60">
        <MobileTopBar />
        <main
          className="@container flex-1 pt-4 pb-24 lg:pt-6 lg:pb-8"
          data-app-main
        >
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
