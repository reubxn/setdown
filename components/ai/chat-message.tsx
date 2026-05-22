// <ChatMessage role="user" content="…" />
"use client";

import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/components/ui/utils";
import type { ChatDisplay } from "@/lib/ai/display";
import { ChatDisplays } from "./displays";

export interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  pending?: boolean;
  displays?: ChatDisplay[];
}

const markdownComponents: Components = {
  p: ({ children }) => (
    <p className="my-2 leading-relaxed first:mt-0 last:mb-0">{children}</p>
  ),
  h1: ({ children }) => (
    <h1 className="mt-4 mb-2 text-base font-semibold text-[var(--text-primary)] first:mt-0">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="mt-4 mb-2 text-[15px] font-semibold text-[var(--text-primary)] first:mt-0">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mt-3 mb-1.5 text-sm font-semibold text-[var(--text-primary)] first:mt-0">
      {children}
    </h3>
  ),
  ul: ({ children }) => (
    <ul className="my-2 ml-5 list-disc space-y-1 marker:text-[var(--text-muted)]">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="my-2 ml-5 list-decimal space-y-1 marker:text-[var(--text-muted)]">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  strong: ({ children }) => (
    <strong className="font-semibold text-[var(--text-primary)]">
      {children}
    </strong>
  ),
  em: ({ children }) => <em className="italic">{children}</em>,
  a: ({ children, href }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="break-all text-[var(--accent)] underline underline-offset-2 hover:opacity-80"
    >
      {children}
    </a>
  ),
  code: ({ children, className }) => {
    const isBlock = /language-/.test(className ?? "");
    if (isBlock) {
      return (
        <code className="block overflow-x-auto rounded-md border border-[var(--border-subtle)] bg-[var(--bg-sunken)] px-3 py-2 text-[12px] text-[var(--text-primary)]">
          {children}
        </code>
      );
    }
    return (
      <code className="rounded bg-[var(--bg-elevated)] px-1 py-0.5 text-[12px] text-[var(--text-primary)]">
        {children}
      </code>
    );
  },
  pre: ({ children }) => <pre className="my-2">{children}</pre>,
  blockquote: ({ children }) => (
    <blockquote className="my-2 border-l-2 border-[var(--accent)] pl-3 text-[var(--text-secondary)]">
      {children}
    </blockquote>
  ),
  table: ({ children }) => (
    <div className="my-2 overflow-x-auto">
      <table className="w-full border-collapse text-[12px]">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border-b border-[var(--border-subtle)] px-2 py-1 text-left font-semibold">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border-b border-[var(--border-subtle)]/50 px-2 py-1 align-top">
      {children}
    </td>
  ),
  hr: () => <hr className="my-3 border-[var(--border-subtle)]" />,
};

export function ChatMessage({
  role,
  content,
  pending,
  displays,
}: ChatMessageProps) {
  if (role === "user") {
    return (
      <div className="ml-auto max-w-[90%] break-words whitespace-pre-wrap rounded-2xl bg-[var(--bg-elevated)] px-4 py-2.5 text-sm text-[var(--text-primary)] sm:max-w-[85%]">
        {content}
      </div>
    );
  }
  const hasDisplays = displays && displays.length > 0;
  return (
    <div
      className={cn(
        "max-w-full break-words rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-base)] px-4 py-3 text-sm leading-relaxed text-[var(--text-primary)] sm:max-w-[90%]",
      )}
    >
      {content ? (
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
          {content}
        </ReactMarkdown>
      ) : pending && !hasDisplays ? (
        <span className="text-[var(--text-muted)]">…</span>
      ) : null}
      {hasDisplays ? <ChatDisplays displays={displays} /> : null}
    </div>
  );
}
