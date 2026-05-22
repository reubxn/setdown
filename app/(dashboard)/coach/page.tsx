"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Lock, Sparkles } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { useDataset } from "@/context/dataset-context";
import { ChatView } from "@/components/ai/chat-view";
import { LoginModal } from "@/components/auth/login-modal";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default function CoachPage() {
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useAuth();
  const { dataset, loading } = useDataset();
  const [loginOpen, setLoginOpen] = useState(false);

  if (isLoading || loading) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-6">
        <header className="mb-6 flex flex-col gap-1">
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
            Coach
          </h1>
          <p className="text-sm text-[var(--text-muted)]">
            Ask anything about your training.
          </p>
        </header>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-6">
        <header className="mb-6 flex flex-col gap-1">
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
            Coach
          </h1>
          <p className="text-sm text-[var(--text-muted)]">
            Ask anything about your training.
          </p>
        </header>
        <EmptyState
          icon={Lock}
          title="Sign in to chat with AI"
          description="The AI coach uses your saved training data. Free, takes a few seconds."
          action={
            <Button onClick={() => setLoginOpen(true)}>
              Sign in to continue
            </Button>
          }
        />
        <LoginModal
          open={loginOpen}
          onClose={() => setLoginOpen(false)}
          title="Sign in to chat with AI"
          subtitle="AI coaching is free with an account."
        />
      </div>
    );
  }

  if (!dataset) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-6">
        <header className="mb-6 flex flex-col gap-1">
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
            Coach
          </h1>
          <p className="text-sm text-[var(--text-muted)]">
            Ask anything about your training.
          </p>
        </header>
        <EmptyState
          icon={Sparkles}
          title="No data to chat about yet"
          description="Upload a Strong CSV to give the coach something to analyze."
          action={
            <Link href="/overview">
              <Button variant="primary">Get started</Button>
            </Link>
          }
        />
      </div>
    );
  }

  // Full-height layout: account for the app-shell's vertical padding
  // (pt-4 pb-24 on mobile, pt-6 pb-8 on lg) so the chat fills what's left.
  return (
    <div className="mx-auto flex h-[calc(100dvh-7rem)] w-full max-w-5xl flex-col px-2 lg:h-[calc(100dvh-3.5rem)] lg:px-4">
      <header className="px-2 pb-3 lg:px-4">
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
          Coach
        </h1>
        <p className="text-sm text-[var(--text-muted)]">
          Ask anything about your training.
        </p>
      </header>
      <div className="flex-1 overflow-hidden rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/40">
        <ChatView pathname={pathname ?? undefined} />
      </div>
    </div>
  );
}
