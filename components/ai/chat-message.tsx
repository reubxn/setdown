// <ChatMessage role="user" content="…" />
"use client";

import { cn } from "@/components/ui/utils";

export interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  pending?: boolean;
}

export function ChatMessage({ role, content, pending }: ChatMessageProps) {
  if (role === "user") {
    return (
      <div className="ml-auto max-w-[85%] rounded-2xl bg-[var(--bg-elevated)] px-4 py-2.5 text-sm text-[var(--text-primary)]">
        {content}
      </div>
    );
  }
  return (
    <div
      className={cn(
        "max-w-[90%] rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-base)] px-4 py-3 text-sm leading-relaxed text-[var(--text-primary)] whitespace-pre-wrap",
      )}
    >
      {content || (pending ? "…" : "")}
    </div>
  );
}
