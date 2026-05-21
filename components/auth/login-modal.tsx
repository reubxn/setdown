"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
}

export function LoginModal({
  open,
  onClose,
  title = "Sign in to setdown",
  subtitle = "Save your data. Chat with AI. It's free.",
}: LoginModalProps) {
  const { signIn } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const handleContinue = useCallback(async () => {
    setSubmitting(true);
    setError(null);
    try {
      await signIn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "sign in failed");
      setSubmitting(false);
    }
  }, [signIn]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-md rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-base)] p-6 shadow-[var(--shadow-elevated)]">
        <h2
          id="login-modal-title"
          className="text-xl font-semibold text-[var(--text-primary)]"
        >
          {title}
        </h2>
        <p className="mt-1 text-sm text-white/70">{subtitle}</p>

        <button
          type="button"
          onClick={handleContinue}
          disabled={submitting}
          className="mt-6 flex w-full items-center justify-center gap-3 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black transition-colors hover:bg-white/90 disabled:opacity-50"
        >
          <GoogleGlyph />
          {submitting ? "Redirecting…" : "Continue with Google"}
        </button>

        {error && (
          <p className="mt-3 text-sm text-[var(--accent-red,#ff5470)]">
            {error}
          </p>
        )}

        <p className="mt-4 text-xs text-white/50">
          We only store your workout data. Nothing else.
        </p>

        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-md p-1 text-white/50 hover:bg-white/10 hover:text-white"
          aria-label="Close"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function GoogleGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}
