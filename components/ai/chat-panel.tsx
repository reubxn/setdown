// <ChatPanel open={open} onClose={…} pathname="/overview" />
"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Plus, Send, Trash2 } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { useAuthToken } from "@convex-dev/auth/react";
import { SlideOver } from "@/components/ui/slide-over";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useDataset } from "@/context/dataset-context";
import { serializeDataset } from "@/lib/ai/tools";
import type { ChatMessage as ChatMessageType } from "@/lib/types";
import {
  type ChatDisplay,
  coerceDisplays,
  isChatDisplay,
} from "@/lib/ai/display";
import { ChatMessage } from "./chat-message";
import { SuggestedPrompts } from "./suggested-prompts";
import { ChatHistorySkeleton } from "@/components/loading/page-skeletons";
import { cn } from "@/components/ui/utils";

interface ChatPanelProps {
  open: boolean;
  onClose: () => void;
  pathname?: string;
}

type PanelMessage = ChatMessageType & { displays?: ChatDisplay[] };

export function ChatPanel({ open, onClose, pathname }: ChatPanelProps) {
  const { dataset } = useDataset();
  const token = useAuthToken();

  const threads = useQuery(
    api.ai.insight_storage.listThreads,
    open ? {} : "skip",
  );
  const [activeThreadId, setActiveThreadId] =
    useState<Id<"chatThreads"> | null>(null);
  const [showThreadList, setShowThreadList] = useState(false);

  const createThread = useMutation(api.ai.insight_storage.createThread);
  const deleteThread = useMutation(api.ai.insight_storage.deleteThread);

  const history = useQuery(
    api.ai.insight_storage.listChatMessages,
    open && activeThreadId
      ? { limit: 50, threadId: activeThreadId }
      : "skip",
  );
  const usage = useQuery(
    api.ai.insight_storage.chatUsageToday,
    open ? {} : "skip",
  );

  const [transient, setTransient] = useState<PanelMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // When the panel opens, pick the most recent thread (or stay blank for new chat).
  useEffect(() => {
    if (!open) return;
    if (activeThreadId) return;
    if (threads && threads.length > 0) {
      setActiveThreadId(threads[0]._id);
    }
  }, [open, threads, activeThreadId]);

  // Clear transient when switching threads.
  useEffect(() => {
    setTransient([]);
  }, [activeThreadId]);

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

  const messages: PanelMessage[] = [
    ...(history ?? []).map(
      (h): PanelMessage => ({
        role: h.role,
        content: h.content,
        displays:
          h.role === "assistant" ? coerceDisplays(h.displays) : undefined,
      }),
    ),
    ...transient,
  ];

  const ensureThread = useCallback(async (): Promise<Id<"chatThreads"> | null> => {
    if (activeThreadId) return activeThreadId;
    try {
      const id = await createThread({});
      setActiveThreadId(id);
      return id;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start thread.");
      return null;
    }
  }, [activeThreadId, createThread]);

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

      const threadId = await ensureThread();
      if (!threadId) return;

      const userMsg: PanelMessage = { role: "user", content: text.trim() };
      const assistantPlaceholder: PanelMessage = {
        role: "assistant",
        content: "",
        displays: [],
      };
      setTransient((m) => [...m, userMsg, assistantPlaceholder]);
      setStreaming(true);

      const serialized = serializeDataset(dataset);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            message: text.trim(),
            threadId,
            pageContext: pathname,
            dataset: serialized,
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error ?? `Request failed (${res.status})`);
        }
        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        let assistantText = "";
        const displays: ChatDisplay[] = [];
        let buffer = "";

        const updateLast = () => {
          setTransient((m) => {
            const copy = [...m];
            copy[copy.length - 1] = {
              role: "assistant",
              content: assistantText,
              displays: [...displays],
            };
            return copy;
          });
        };

        const handleEvent = (raw: string) => {
          const line = raw.trim();
          if (!line) return;
          let evt: unknown;
          try {
            evt = JSON.parse(line);
          } catch {
            // Backwards compatibility: if the server ever sends plain text,
            // append it verbatim.
            assistantText += line;
            updateLast();
            return;
          }
          if (!evt || typeof evt !== "object") return;
          const e = evt as { type?: unknown; value?: unknown };
          if (e.type === "text" && typeof e.value === "string") {
            assistantText += e.value;
            updateLast();
          } else if (e.type === "display" && isChatDisplay(e.value)) {
            displays.push(e.value);
            updateLast();
          } else if (e.type === "error" && typeof e.value === "string") {
            assistantText += `\n\n_${e.value}_`;
            updateLast();
          }
        };

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            let nl = buffer.indexOf("\n");
            while (nl !== -1) {
              const line = buffer.slice(0, nl);
              buffer = buffer.slice(nl + 1);
              handleEvent(line);
              nl = buffer.indexOf("\n");
            }
          }
          if (buffer.trim().length > 0) handleEvent(buffer);
        } else {
          const text = await res.text();
          for (const line of text.split("\n")) handleEvent(line);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Chat failed.");
        setTransient((m) => m.slice(0, -1));
      } finally {
        setStreaming(false);
      }
    },
    [dataset, pathname, streaming, token, ensureThread],
  );

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    send(input);
  };

  const onNewChat = async () => {
    if (streaming) return;
    setError(null);
    setTransient([]);
    setActiveThreadId(null);
    setShowThreadList(false);
  };

  const onPickThread = (id: Id<"chatThreads">) => {
    if (streaming) return;
    setActiveThreadId(id);
    setShowThreadList(false);
    setError(null);
  };

  const onDeleteThread = async (id: Id<"chatThreads">) => {
    if (streaming) return;
    try {
      await deleteThread({ threadId: id });
      if (id === activeThreadId) {
        setActiveThreadId(null);
        setTransient([]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete thread.");
    }
  };

  const remaining = usage ? Math.max(0, usage.limit - usage.used) : null;

  const activeThread = threads?.find((t) => t._id === activeThreadId);
  const title = activeThread?.title ?? "New chat";

  return (
    <SlideOver
      open={open}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowThreadList((v) => !v)}
            className="max-w-[220px] truncate text-left text-base font-semibold text-[var(--text-primary)] hover:text-[var(--accent)]"
            aria-label="Switch chat thread"
          >
            {title}
          </button>
          <button
            type="button"
            onClick={onNewChat}
            disabled={streaming}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-[var(--border-subtle)] text-[var(--text-secondary)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:opacity-50"
            aria-label="New chat"
            title="New chat"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      }
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
      {showThreadList ? (
        <div className="mb-3 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-2">
          <div className="flex items-center justify-between px-1 pb-2 text-[11px] font-medium uppercase tracking-wide text-[var(--text-muted)]">
            <span>Chats</span>
            <button
              type="button"
              onClick={onNewChat}
              className="text-[var(--accent)] hover:opacity-80"
            >
              + New chat
            </button>
          </div>
          {threads && threads.length > 0 ? (
            <ul className="max-h-56 space-y-0.5 overflow-y-auto">
              {threads.map((t) => (
                <li
                  key={t._id}
                  className={cn(
                    "group flex items-center gap-1 rounded px-2 py-1.5 text-sm",
                    t._id === activeThreadId
                      ? "bg-[var(--bg-base)] text-[var(--text-primary)]"
                      : "text-[var(--text-secondary)] hover:bg-[var(--bg-base)]",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => onPickThread(t._id)}
                    className="flex-1 truncate text-left"
                  >
                    {t.title}
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteThread(t._id)}
                    className="text-[var(--text-muted)] opacity-0 transition-opacity hover:text-[var(--danger)] group-hover:opacity-100"
                    aria-label={`Delete ${t.title}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-2 py-1 text-xs text-[var(--text-muted)]">
              No previous chats.
            </p>
          )}
        </div>
      ) : null}

      <div
        ref={scrollRef}
        className="flex h-full flex-col gap-3 overflow-y-auto"
      >
        {open && activeThreadId && history === undefined ? (
          <ChatHistorySkeleton />
        ) : messages.length === 0 && !streaming ? (
          <div className="space-y-3">
            <p className="text-sm text-[var(--text-secondary)]">
              Ask anything about your training. The coach can pull up sessions,
              PRs, body data, and muscle-group breakdowns on the fly.
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
            displays={m.displays}
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
