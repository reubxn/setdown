// <SuggestedPrompts path={pathname} onPick={send} />
"use client";

import { suggestedPromptsForPath } from "@/lib/ai/build-context";

export interface SuggestedPromptsProps {
  path?: string;
  onPick: (prompt: string) => void;
  disabled?: boolean;
}

export function SuggestedPrompts({
  path,
  onPick,
  disabled,
}: SuggestedPromptsProps) {
  const prompts = suggestedPromptsForPath(path);
  return (
    <div className="flex flex-wrap gap-2">
      {prompts.map((p) => (
        <button
          key={p.label}
          type="button"
          disabled={disabled}
          onClick={() => onPick(p.prompt)}
          className="rounded-full border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-1.5 text-xs text-[var(--text-secondary)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:opacity-50"
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
