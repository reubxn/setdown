// <ChatPanel open={open} onClose={…} pathname="/overview" />
"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Send } from "lucide-react";
import { useQuery } from "convex/react";
import { useAuthToken } from "@convex-dev/auth/react";
import { SlideOver } from "@/components/ui/slide-over";
import { api } from "@/convex/_generated/api";
import { useDataset } from "@/context/dataset-context";
import { buildAIContext } from "@/lib/ai/build-context";
import type { ChatMessage as ChatMessageType } from "@/lib/types";
import { ChatMessage } from "./chat-message";
import { SuggestedPrompts } from "./suggested-prompts";
import { ChatHistorySkeleton } from "@/components/loading/page-skeletons";

interface ChatPanelProps {
  open: boolean;
  onClose: () => void;
  pathname?: string;
}

export function ChatPanel({ open, onClose, pathname }: ChatPanelProps) {
  const { dataset } = useDataset();
  const token = useAuthToken();
  const history = useQuery(
    api.ai.insight_storage.listChatMessages,
    open ? { limit: 50 } : "skip",
  );
  const usage = useQuery(
    api.ai.insight_storage.chatUsageToday,
    open ? {} : "skip",
  );

  const [transient, setTransient] = useState<ChatMessageType[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!history) return;
    setTransient((prev) =>
      prev.filter(
        (t) =>
          !history.some(
            (h) => h.content === t.content && h.role === t.role,
          ),
      ),
    );
  }, [history]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [history, transient, streaming]);

  const messages: ChatMessageType[] = [
    ...(history ?? []).map((h) => ({ role: h.role, content: h.content })),
    ...transient,
  ];

  const send = useCallback(
    async (text: string) => {
      if (!text.trim() || streaming) return;
      if (!dataset) {
        setError("Upload your Strong CSV first to chat about your training.");
        return;
      }
      if (!token) {
        setError("Sign in to chat with AI.");
        return;
      }
      setError(null);
      setInput("");

      const userMsg: ChatMessageType = { role: "user", content: text.trim() };
      const assistantPlaceholder: ChatMessageType = {
        role: "assistant",
        content: "",
      };
      setTransient((m) => [...m, userMsg, assistantPlaceholder]);
      setStreaming(true);

      const context = buildAIContext(dataset, text.trim(), { path: pathname });

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            message: text.trim(),
            context,
            pageContext: pathname,
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error ?? `Request failed (${res.status})`);
        }
        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        let assistantText = "";
        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            assistantText += decoder.decode(value, { stream: true });
            setTransient((m) => {
              const copy = [...m];
              copy[copy.length - 1] = {
                role: "assistant",
                content: assistantText,
              };
              return copy;
            });
          }
        } else {
          assistantText = await res.text();
          setTransient((m) => {
            const copy = [...m];
            copy[copy.length - 1] = {
              role: "assistant",
              content: assistantText,
            };
            return copy;
          });
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Chat failed.");
        setTransient((m) => m.slice(0, -1));
      } finally {
        setStreaming(false);
      }
    },
    [dataset, pathname, streaming, token],
  );

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    send(input);
  };

  const remaining = usage ? Math.max(0, usage.limit - usage.used) : null;

  return (
    <SlideOver
      open={open}
      onClose={onClose}
      title="AI coach"
      description={
        remaining !== null
          ? `${remaining} of ${usage?.limit} messages left today`
          : "Ask about your training"
      }
      width="lg"
      footer={
        <form onSubmit={onSubmit} className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={streaming || !dataset}
            placeholder={
              dataset
                ? "Ask about your training…"
                : "Upload a CSV first to enable chat"
            }
            className="flex-1 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--accent)] disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={streaming || !input.trim() || !dataset}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-[var(--accent)] text-black transition-colors hover:bg-[var(--accent-hover)] disabled:bg-[var(--accent-muted)] disabled:text-[var(--text-muted)]"
            aria-label="Send"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      }
    >
      <div
        ref={scrollRef}
        className="flex h-full flex-col gap-3 overflow-y-auto"
      >
        {open && history === undefined ? (
          <ChatHistorySkeleton />
        ) : messages.length === 0 && !streaming ? (
          <div className="space-y-3">
            <p className="text-sm text-[var(--text-secondary)]">
              Ask anything about your training data. Only a compact summary is
              sent to Claude.
            </p>
            <SuggestedPrompts
              path={pathname}
              onPick={(p) => send(p)}
              disabled={streaming || !dataset}
            />
          </div>
        ) : null}
        {messages.map((m, i) => (
          <ChatMessage
            key={i}
            role={m.role}
            content={m.content}
            pending={
              streaming && i === messages.length - 1 && m.role === "assistant"
            }
          />
        ))}
        {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
      </div>
    </SlideOver>
  );
}
