"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { LoginModal } from "@/components/auth/login-modal";
import { cn } from "@/lib/utils";

export function TopBar({ className }: { className?: string }) {
  const { isAuthenticated } = useAuth();
  const [loginOpen, setLoginOpen] = useState(false);

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
          "sticky top-0 z-30 flex h-14 items-center justify-end border-b border-[var(--border-subtle)] bg-[var(--bg-base)]/85 px-4 backdrop-blur-md lg:px-8",
          className,
        )}
      >
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
