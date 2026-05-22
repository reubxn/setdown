"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { SignInButton } from "@/components/auth/sign-in-button";

export function MobileTopBar() {
  const { user, isAuthenticated, isLoading, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  const initial = (user?.name ?? user?.email ?? "?").slice(0, 1).toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-12 items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)]/95 px-4 backdrop-blur-md lg:hidden">
      <Link href="/" className="block">
        <span className="font-display text-xl text-[var(--text-primary)]">
          setdown
        </span>
      </Link>

      {isLoading ? (
        <div className="h-8 w-8" />
      ) : isAuthenticated ? (
        <div ref={ref} className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex h-8 w-8 items-center justify-center rounded-full"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label="Account menu"
          >
            {user?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.image}
                alt=""
                className="h-8 w-8 rounded-full"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent)] text-sm font-semibold text-black">
                {initial}
              </div>
            )}
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 top-full mt-2 w-48 overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] shadow-[var(--shadow-elevated)]"
            >
              <Link
                href="/settings"
                role="menuitem"
                onClick={() => setMenuOpen(false)}
                className="block px-4 py-2.5 text-sm text-[var(--text-primary)] hover:bg-white/5"
              >
                Settings
              </Link>
              <button
                type="button"
                role="menuitem"
                onClick={async () => {
                  setMenuOpen(false);
                  await signOut();
                }}
                className="block w-full px-4 py-2.5 text-left text-sm text-[var(--text-primary)] hover:bg-white/5"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      ) : (
        <SignInButton className="px-3 py-1.5 text-xs" />
      )}
    </header>
  );
}
