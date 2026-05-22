// <ChatView pathname="/coach" /> — full-page chat experience for /coach
"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { ChevronDown, Plus, Send, Trash2 } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { useAuthToken } from "@convex-dev/auth/react";
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

interface ChatViewProps {
  pathname?: string;
}

type ViewMessage = ChatMessageType & { displays?: ChatDisplay[] };

export function ChatView({ pathname }: ChatViewProps) {
  const { dataset } = useDataset();
  const token = useAuthToken();

  const threads = useQuery(api.ai.insight_storage.listThreads, {});
  const [activeThreadId, setActiveThreadId] =
    useState<Id<"chatThreads"> | null>(null);
  const [showThreadList, setShowThreadList] = useState(false);

  const createThread = useMutation(api.ai.insight_storage.createThread);
  const deleteThread = useMutation(api.ai.insight_storage.deleteThread);

  const history = useQuery(
    api.ai.insight_storage.listChatMessages,
    activeThreadId ? { limit: 50, threadId: activeThreadId } : "skip",
  );
  const usage = useQuery(api.ai.insight_storage.chatUsageToday, {});

  const [transient, setTransient] = useState<ViewMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-pick most recent thread on first load (don't override new-chat state).
  const initialisedRef = useRef(false);
  useEffect(() => {
    if (initialisedRef.current) return;
    if (!threads) return;
    if (threads.length > 0) {
      setActiveThreadId(threads[0]._id);
    }
    initialisedRef.current = true;
  }, [threads]);

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

  const messages: ViewMessage[] = [
    ...(history ?? []).map(
      (h): ViewMessage => ({
        role: h.role,
        content: h.content,
        displays:
          h.role === "assistant" ? coerceDisplays(h.displays) : undefined,
      }),
    ),
    ...transient,
  ];

  const ensureThread =
    useCallback(async (): Promise<Id<"chatThreads"> | null> => {
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

      const userMsg: ViewMessage = { role: "user", content: text.trim() };
      const assistantPlaceholder: ViewMessage = {
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

  const onNewChat = () => {
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
  const activeTitle = activeThread?.title ?? "New chat";

  return (
    <div className="flex h-full flex-col">
      {/* Thread switcher row */}
      <div className="border-b border-[var(--border-subtle)] bg-[var(--bg-base)]/60 px-4 py-2 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center gap-2">
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowThreadList((v) => !v)}
              className="inline-flex max-w-[260px] items-center gap-1.5 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-2.5 py-1.5 text-sm font-medium text-[var(--text-primary)] hover:border-[var(--accent)]"
              aria-label="Switch chat thread"
              aria-expanded={showThreadList}
            >
              <span className="truncate">{activeTitle}</span>
              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[var(--text-muted)]" />
            </button>
            {showThreadList ? (
              <div className="absolute left-0 top-full z-20 mt-1 w-72 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-2 shadow-lg">
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
                  <ul className="max-h-72 space-y-0.5 overflow-y-auto">
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
          </div>
          <button
            type="button"
            onClick={onNewChat}
            disabled={streaming}
            className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border-subtle)] px-2.5 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:opacity-50"
            aria-label="New chat"
          >
            <Plus className="h-3.5 w-3.5" />
            New chat
          </button>
          <div className="ml-auto text-xs text-[var(--text-muted)]">
            {remaining !== null
              ? `${remaining} of ${usage?.limit} left today`
              : null}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto flex max-w-3xl flex-col gap-3">
          {activeThreadId && history === undefined ? (
            <ChatHistorySkeleton />
          ) : messages.length === 0 && !streaming ? (
            <div className="space-y-3">
              <p className="text-sm text-[var(--text-secondary)]">
                Ask anything about your training. The coach can pull up
                sessions, PRs, body data, and muscle-group breakdowns on the
                fly.
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
                streaming &&
                i === messages.length - 1 &&
                m.role === "assistant"
              }
            />
          ))}
          {error ? (
            <p className="text-sm text-[var(--danger)]">{error}</p>
          ) : null}
        </div>
      </div>

      {/* Composer */}
      <div className="border-t border-[var(--border-subtle)] bg-[var(--bg-base)]/80 px-4 py-3 backdrop-blur-sm">
        <form
          onSubmit={onSubmit}
          className="mx-auto flex max-w-3xl items-center gap-2"
        >
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
            className="flex-1 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--accent)] disabled:opacity-50"
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
      </div>
    </div>
  );
}
