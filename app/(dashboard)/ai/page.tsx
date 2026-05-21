"use client";

import { useState, useRef, useEffect } from "react";
import { useDataset } from "@/context/dataset-context";
import { ChatInput } from "@/components/legacy/chat-input";
import { InsightCard } from "@/components/legacy/card";
import { PageShell } from "@/components/layout/page-shell";
import { buildAIContext } from "@/lib/ai-context";
import type { ChatMessage } from "@/lib/types";

const SUGGESTED = [
  "Volume trend",
  "Plateau risks",
  "What should I focus on?",
];

const STORAGE_KEY = "setdown-chat-messages";

export default function AIPage() {
  const { dataset } = useDataset();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) setMessages(JSON.parse(saved));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-20)));
    }
  }, [messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streaming]);

  async function sendMessage(text: string) {
    if (!dataset || !text.trim() || streaming) return;

    const userMsg: ChatMessage = { role: "user", content: text.trim() };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setStreaming(true);

    const context = buildAIContext(dataset, text.trim());

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text.trim(), context }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? `Request failed (${res.status})`);
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let assistantText = "";

      setMessages((m) => [...m, { role: "assistant", content: "" }]);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          assistantText += decoder.decode(value, { stream: true });
          const current = assistantText;
          setMessages((m) => {
            const copy = [...m];
            copy[copy.length - 1] = { role: "assistant", content: current };
            return copy;
          });
        }
      } else {
        assistantText = await res.text();
        setMessages((m) => {
          const copy = [...m];
          copy[copy.length - 1] = { role: "assistant", content: assistantText };
          return copy;
        });
      }
    } catch (e) {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content:
            e instanceof Error
              ? e.message
              : "Something went wrong. Check your API key and try again.",
        },
      ]);
    } finally {
      setStreaming(false);
    }
  }

  return (
    <PageShell
      title="AI Coach"
      subtitle="Ask questions about your training summary"
      className="flex flex-col lg:min-h-[calc(100dvh-4rem)]"
    >
      <div className="flex flex-1 flex-col gap-6 lg:flex-row lg:gap-10">
        {dataset && (
          <aside className="lg:w-72 lg:shrink-0">
            <p className="mb-3 text-xs font-medium tracking-[0.08em] text-[var(--text-muted)] uppercase">
              Suggested
            </p>
            <div className="flex flex-wrap gap-2 lg:flex-col lg:items-stretch">
              {SUGGESTED.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => sendMessage(chip)}
                  disabled={streaming}
                  className="rounded-xl border border-white/10 px-4 py-2.5 text-left text-sm text-[var(--text-muted)] transition-colors hover:border-[var(--accent-blue)]/50 hover:bg-white/5 hover:text-white disabled:opacity-50"
                >
                  {chip}
                </button>
              ))}
            </div>
            <p className="mt-6 hidden text-xs leading-relaxed text-[var(--text-muted)] lg:block">
              Only a compact summary of your stats is sent to Claude — never your
              full CSV.
            </p>
          </aside>
        )}

        <div className="flex min-h-[50dvh] flex-1 flex-col lg:max-w-3xl">
          {!dataset && (
            <p className="text-sm text-[var(--text-muted)]">
              Upload a CSV first to enable AI coaching.
            </p>
          )}

          {dataset && messages.length === 0 && (
            <div className="flex flex-wrap gap-2 lg:hidden">
              {SUGGESTED.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => sendMessage(chip)}
                  className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-[var(--text-muted)] hover:border-[var(--accent-blue)]/50 hover:text-white transition-colors"
                >
                  {chip}
                </button>
              ))}
            </div>
          )}

          <div className="mt-4 flex-1 space-y-4 overflow-y-auto pb-4 lg:mt-0">
            {messages.map((msg, i) =>
              msg.role === "user" ? (
                <div
                  key={i}
                  className="ml-auto max-w-[85%] rounded-2xl bg-[var(--card-alt)] px-4 py-3 text-sm lg:max-w-[70%] lg:text-base"
                >
                  {msg.content}
                </div>
              ) : (
                <InsightCard key={i}>
                  <p className="text-sm text-white/90 whitespace-pre-wrap leading-relaxed lg:text-base">
                    {msg.content ||
                      (streaming && i === messages.length - 1 ? "…" : "")}
                  </p>
                </InsightCard>
              )
            )}
            <div ref={bottomRef} />
          </div>

          <div className="sticky bottom-20 border-t border-white/5 bg-[var(--bg-primary)] pt-4 lg:static lg:bottom-auto lg:mt-4 lg:border-0 lg:pt-0">
            <ChatInput
              value={input}
              onChange={setInput}
              onSubmit={() => sendMessage(input)}
              disabled={!dataset || streaming}
            />
            <p className="mt-2 text-center text-[10px] text-[var(--text-muted)] lg:hidden">
              Only a summary is sent to Claude — not your full CSV
            </p>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
