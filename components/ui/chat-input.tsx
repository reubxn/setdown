"use client";

import { Send } from "lucide-react";
import { cn } from "@/lib/utils";

export function ChatInput({
  value,
  onChange,
  onSubmit,
  disabled,
  placeholder = "Ask about your training…",
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!disabled && value.trim()) onSubmit();
      }}
      className="flex items-center gap-2 rounded-full border border-white/10 bg-[var(--card)] px-4 py-2"
    >
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        className="flex-1 bg-transparent text-sm text-white placeholder:text-[var(--text-muted)] outline-none disabled:opacity-50"
      />
      <button
        type="submit"
        disabled={disabled || !value.trim()}
        className={cn(
          "rounded-full p-2 transition-colors",
          disabled ? "text-[var(--text-muted)]" : "text-[var(--accent-blue)] hover:bg-white/5"
        )}
      >
        <Send className="h-4 w-4" strokeWidth={1.5} />
      </button>
    </form>
  );
}
