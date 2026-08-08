"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dumbbell, History, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/overview", label: "Overview", icon: LayoutDashboard },
  { href: "/exercises", label: "Exercises", icon: Dumbbell },
  { href: "/history", label: "History", icon: History },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--border-subtle)] bg-[var(--bg-elevated)]/95 backdrop-blur-md lg:hidden">
      <div className="mx-auto flex max-w-lg items-center justify-around px-2 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {items.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href ||
            (href !== "/overview" && pathname.startsWith(href));
          return (
            <Link
              key={label}
              href={href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1 text-[10px] font-medium transition-colors",
                active
                  ? "text-[var(--accent)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)]",
              )}
            >
              <Icon strokeWidth={1.75} className="h-5 w-5" />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
