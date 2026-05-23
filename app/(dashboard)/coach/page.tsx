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
import { PageShell } from "@/components/layout/page-shell";

export default function CoachPage() {
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useAuth();
  const { dataset, loading } = useDataset();
  const [loginOpen, setLoginOpen] = useState(false);

  if (isLoading || loading) {
    return (
      <PageShell title="Coach" subtitle="Ask anything about your training.">
        <></>
      </PageShell>
    );
  }

  if (!isAuthenticated) {
    return (
      <PageShell title="Coach" subtitle="Ask anything about your training.">
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
      </PageShell>
    );
  }

  if (!dataset) {
    return (
      <PageShell title="Coach" subtitle="Ask anything about your training.">
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
      </PageShell>
    );
  }

  // Full-height chat: account for the app-shell's vertical padding
  // (pt-4 pb-24 on mobile, pt-6 pb-8 on lg) plus the page-shell's own
  // py-6/lg:py-8 so the chat fills what's left under the heading.
  return (
    <div className="mx-auto flex h-[calc(100dvh-10rem)] w-full max-w-[1600px] flex-col px-4 py-6 sm:px-6 lg:h-[calc(100dvh-3.5rem)] lg:px-10 lg:py-8">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl lg:text-4xl">Coach</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)] lg:text-base">
            Ask anything about your training.
          </p>
        </div>
      </header>
      <div className="flex-1 overflow-hidden rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/40">
        <ChatView pathname={pathname ?? undefined} />
      </div>
    </div>
  );
}
