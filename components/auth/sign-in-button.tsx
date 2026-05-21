"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/auth-context";
import { LoginModal } from "./login-modal";

export function SignInButton({
  className,
  label = "Sign in",
}: {
  className?: string;
  label?: string;
}) {
  const { isAuthenticated, isLoading } = useAuth();
  const [open, setOpen] = useState(false);

  if (isLoading || isAuthenticated) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "rounded-xl bg-[var(--accent-green)] px-4 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-[var(--accent-green)]/90 disabled:opacity-50",
          className,
        )}
      >
        {label}
      </button>
      <LoginModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
