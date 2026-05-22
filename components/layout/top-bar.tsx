"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { Sparkles } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { LoginModal } from "@/components/auth/login-modal";
import { cn } from "@/lib/utils";

const titles: Record<string, string> = {
  "/overview": "Dashboard",
  "/exercises": "Exercises",
  "/history": "History",
  "/body": "Body",
  "/insights": "Insights",
  "/settings": "Settings",
};

function deriveTitle(pathname: string): string {
  if (titles[pathname]) return titles[pathname];
  for (const [prefix, title] of Object.entries(titles)) {
    if (prefix !== "/overview" && pathname.startsWith(prefix)) return title;
  }
  return "setdown";
}

export function TopBar({ className }: { className?: string }) {
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();
  const [loginOpen, setLoginOpen] = useState(false);

  const title = deriveTitle(pathname);

  const handleAi = () => {
    if (!isAuthenticated) {
      setLoginOpen(true);
      return;
    }
    window.dispatchEvent(new CustomEvent("setdown:open-ai"));
  };

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-30 flex h-14 items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--bg-base)]/85 px-4 backdrop-blur-md lg:px-8",
          className,
        )}
      >
        <h1
          className="text-2xl tracking-wide uppercase text-[var(--text-primary)]"
          style={{ fontFamily: "var(--font-bebas)" }}
        >
          {title}
        </h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleAi}
            aria-label="Open AI coach"
            className="inline-flex items-center gap-1.5 rounded-md bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold text-black transition-colors hover:bg-[var(--accent-hover)]"
          >
            <Sparkles className="h-3.5 w-3.5" strokeWidth={2} />
            AI
          </button>
        </div>
      </header>
      <LoginModal
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        title="Sign in to chat with AI"
        subtitle="AI coaching is free with an account."
      />
    </>
  );
}
