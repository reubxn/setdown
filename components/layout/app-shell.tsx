"use client";

import { Sidebar } from "./sidebar";
import { BottomNav } from "./bottom-nav";
import { TopBar } from "./top-bar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-[var(--bg-base)]">
      <Sidebar />
      <div className="flex min-h-dvh flex-col lg:ml-60">
        <TopBar />
        <main className="@container flex-1 pb-24 lg:pb-8" data-app-main>
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
