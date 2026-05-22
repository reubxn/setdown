"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Dumbbell,
  History,
  Home,
  Settings,
  Sparkles,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/auth-context";
import { UserMenu } from "@/components/auth/user-menu";
import { SignInButton } from "@/components/auth/sign-in-button";

interface NavItem {
  href: string;
  label: string;
  icon: typeof Home;
  authOnly?: boolean;
}

const baseNav: NavItem[] = [
  { href: "/overview", label: "Dashboard", icon: Home },
  { href: "/exercises", label: "Exercises", icon: Dumbbell },
  { href: "/history", label: "History", icon: History },
  { href: "/body", label: "Body", icon: User, authOnly: true },
  { href: "/insights", label: "Insights", icon: BarChart3, authOnly: true },
  { href: "/coach", label: "Coach", icon: Sparkles, authOnly: true },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();

  const items = baseNav.filter((item) => !item.authOnly || isAuthenticated);

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-[var(--border-subtle)] bg-[var(--bg-elevated)] lg:flex">
      <div className="border-b border-[var(--border-subtle)] px-5 py-5">
        <Link href="/" className="block">
          <span className="font-display text-2xl text-[var(--text-primary)]">
            setdown
          </span>
        </Link>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        {items.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href ||
            (href !== "/overview" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-[var(--accent-muted)] text-[var(--text-primary)]"
                  : "text-[var(--text-secondary)] hover:bg-[var(--bg-base)] hover:text-[var(--text-primary)]",
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0",
                  active ? "text-[var(--accent)]" : "",
                )}
                strokeWidth={1.75}
              />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-[var(--border-subtle)] p-3">
        {isAuthenticated ? (
          <UserMenu />
        ) : (
          <SignInButton className="w-full" />
        )}
      </div>
    </aside>
  );
}
