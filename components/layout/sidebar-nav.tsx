"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { format } from "date-fns";
import {
  Dumbbell,
  History,
  Home,
  MessageSquare,
  Settings,
  Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useDataset } from "@/context/dataset-context";

const navItems = [
  { href: "/overview", label: "Overview", icon: Home },
  { href: "/exercises", label: "Exercises", icon: Dumbbell },
  { href: "/history", label: "History", icon: History },
  { href: "/ai", label: "AI Coach", icon: MessageSquare },
];

export function SidebarNav() {
  const pathname = usePathname();
  const { dataset } = useDataset();

  return (
    <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 flex-col border-r border-white/5 bg-[var(--bg-secondary)] lg:flex">
      <div className="flex flex-col gap-1 border-b border-white/5 px-5 py-6">
        <Link href="/overview" className="group">
          <span className="font-display text-2xl text-white">
            setdown
          </span>
          <p className="mt-0.5 text-xs text-[var(--text-muted)] group-hover:text-white/80 transition-colors">
            drop your Strong export, see your numbers
          </p>
        </Link>
      </div>

      <nav className="flex-1 space-y-0.5 px-3 py-4">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href ||
            (href !== "/overview" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-white/10 text-white"
                  : "text-[var(--text-muted)] hover:bg-white/5 hover:text-white"
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5 shrink-0",
                  active ? "text-[var(--accent-blue)]" : ""
                )}
                strokeWidth={1.5}
              />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-2 border-t border-white/5 p-4">
        <Link
          href="/upload?replace=1"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-white/90"
        >
          <Upload className="h-4 w-4" strokeWidth={2} />
          Upload CSV
        </Link>
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors",
            pathname === "/settings"
              ? "bg-white/10 text-white"
              : "text-[var(--text-muted)] hover:bg-white/5 hover:text-white"
          )}
        >
          <Settings className="h-4 w-4" strokeWidth={1.5} />
          Settings
        </Link>
        {dataset && (
          <p className="px-3 pt-2 text-[10px] leading-relaxed text-[var(--text-muted)]">
            {format(dataset.dateRange.start, "MMM yyyy")} —{" "}
            {format(dataset.dateRange.end, "MMM yyyy")}
            <br />
            {dataset.sessions.length} sessions · {dataset.exercises.length}{" "}
            exercises
          </p>
        )}
      </div>
    </aside>
  );
}
