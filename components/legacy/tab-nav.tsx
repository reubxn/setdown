"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/overview", tab: null, label: "OVERVIEW" },
  { href: "/overview?tab=volume", tab: "volume", label: "VOLUME" },
  { href: "/overview?tab=prs", tab: "prs", label: "PRS" },
  { href: "/ai", tab: null, label: "AI" },
] as const;

export function TabNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab");

  return (
    <nav className="flex gap-6 overflow-x-auto border-b border-white/5 px-4 scrollbar-none lg:gap-8 lg:px-0">
      {tabs.map((tab) => {
        const active =
          tab.href === "/ai"
            ? pathname === "/ai"
            : pathname.startsWith("/overview") &&
              (tab.tab === null ? !currentTab : currentTab === tab.tab);
        const href = tab.href;
        return (
          <Link
            key={tab.label}
            href={href}
            className={cn(
              "shrink-0 pb-3 text-xs font-medium tracking-[0.08em] transition-colors",
              active
                ? "border-b-2 border-white text-white"
                : "text-[var(--text-muted)] hover:text-white"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
