import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "../_generated/server";
import { rateLimiter } from "../rateLimits";

const MAX_TITLE_LEN = 200;
const MAX_USER_MESSAGE_LEN = 10_000;
const MAX_ASSISTANT_MESSAGE_LEN = 50_000;
const MAX_DISPLAYS = 8;
const DAILY_CHAT_LIMIT = 50;

const exerciseChartDisplay = v.object({
  kind: v.literal("exercise_chart"),
  exercise: v.string(),
  metric: v.union(v.literal("max_weight"), v.literal("estimated_1rm")),
  windowWeeks: v.number(),
  points: v.array(
    v.object({
      date: v.string(),
      maxWeightKg: v.number(),
      est1RMKg: v.number(),
      volumeKg: v.number(),
    }),
  ),
});

const workoutPlanDisplay = v.object({
  kind: v.literal("workout_plan"),
  title: v.string(),
  exercises: v.array(
    v.object({
      name: v.string(),
      sets: v.number(),
      reps: v.string(),
      weight: v.optional(v.number()),
      notes: v.optional(v.string()),
    }),
  ),
  notes: v.optional(v.string()),
});

const statHighlightDisplay = v.object({
  kind: v.literal("stat_highlight"),
  label: v.string(),
  value: v.string(),
  unit: v.optional(v.string()),
  delta: v.optional(
    v.object({
      value: v.string(),
      direction: v.union(
        v.literal("up"),
        v.literal("down"),
        v.literal("flat"),
      ),
    }),
  ),
  context: v.optional(v.string()),
});

const sessionListDisplay = v.object({
  kind: v.literal("session_list"),
  sessions: v.array(
    v.object({
      date: v.string(),
      name: v.optional(v.string()),
      topLifts: v.array(v.string()),
    }),
  ),
});

const displayValidator = v.union(
  exerciseChartDisplay,
  workoutPlanDisplay,
  statHighlightDisplay,
  sessionListDisplay,
);

export const listChatMessages = query({
  args: {
    limit: v.optional(v.number()),
    threadId: v.optional(v.id("chatThreads")),
  },
  handler: async (ctx, { limit, threadId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    if (!threadId) return [];
    const thread = await ctx.db.get(threadId);
    if (!thread || thread.userId !== userId) return [];
    const rows = await ctx.db
      .query("chatMessages")
      .withIndex("by_thread_created", (q) => q.eq("threadId", threadId))
      .order("desc")
      .take(limit ?? 50);
    return rows.reverse().map((r) => ({
      _id: r._id,
      role: r.role,
      content: r.content,
      createdAt: r.createdAt,
      pageContext: r.pageContext ?? null,
      displays: r.displays ?? null,
    }));
  },
});

export const listThreads = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const rows = await ctx.db
      .query("chatThreads")
      .withIndex("by_user_last", (q) => q.eq("userId", userId))
      .order("desc")
      .take(50);
    return rows.map((r) => ({
      _id: r._id,
      title: r.title,
      createdAt: r.createdAt,
      lastMessageAt: r.lastMessageAt,
    }));
  },
});

export const createThread = mutation({
  args: { title: v.optional(v.string()) },
  handler: async (ctx, { title }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    await rateLimiter.limit(ctx, "createThread", { key: userId, throws: true });
    const trimmed = title?.trim() || "New chat";
    if (trimmed.length > MAX_TITLE_LEN) {
      throw new Error(`title exceeds ${MAX_TITLE_LEN} chars`);
    }
    const now = Date.now();
    const id = await ctx.db.insert("chatThreads", {
      userId,
      title: trimmed,
      createdAt: now,
      lastMessageAt: now,
    });
    return id;
  },
});

export const renameThread = mutation({
  args: { threadId: v.id("chatThreads"), title: v.string() },
  handler: async (ctx, { threadId, title }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    await rateLimiter.limit(ctx, "renameThread", { key: userId, throws: true });
    const trimmed = title.trim() || "New chat";
    if (trimmed.length > MAX_TITLE_LEN) {
      throw new Error(`title exceeds ${MAX_TITLE_LEN} chars`);
    }
    const thread = await ctx.db.get(threadId);
    if (!thread || thread.userId !== userId) throw new Error("Not found");
    await ctx.db.patch(threadId, { title: trimmed });
  },
});

export const deleteThread = mutation({
  args: { threadId: v.id("chatThreads") },
  handler: async (ctx, { threadId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    await rateLimiter.limit(ctx, "deleteThread", { key: userId, throws: true });
    const thread = await ctx.db.get(threadId);
    if (!thread || thread.userId !== userId) throw new Error("Not found");
    const msgs = await ctx.db
      .query("chatMessages")
      .withIndex("by_thread_created", (q) => q.eq("threadId", threadId))
      .collect();
    for (const m of msgs) {
      await ctx.db.delete(m._id);
    }
    await ctx.db.delete(threadId);
  },
});

export const chatUsageToday = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { used: 0, limit: DAILY_CHAT_LIMIT };
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const since = startOfDay.getTime();
    const rows = await ctx.db
      .query("chatMessages")
      .withIndex("by_user_created", (q) =>
        q.eq("userId", userId).gte("createdAt", since),
      )
      .collect();
    const userMsgs = rows.filter((r) => r.role === "user").length;
    return { used: userMsgs, limit: DAILY_CHAT_LIMIT };
  },
});

// Consumes one chatRequest token + verifies the user is under the daily cap.
// Called by /api/chat before the Anthropic call so an unprivileged token loop
// can't burn credits past the configured rate.
export const reserveChatTurn = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const rows = await ctx.db
      .query("chatMessages")
      .withIndex("by_user_created", (q) =>
        q.eq("userId", userId).gte("createdAt", startOfDay.getTime()),
      )
      .collect();
    const used = rows.filter((r) => r.role === "user").length;
    if (used >= DAILY_CHAT_LIMIT) {
      throw new Error("daily_limit");
    }

    await rateLimiter.limit(ctx, "chatRequest", { key: userId, throws: true });
    return { ok: true } as const;
  },
});

export const recordChatTurn = mutation({
  args: {
    threadId: v.id("chatThreads"),
    userMessage: v.string(),
    assistantMessage: v.string(),
    pageContext: v.optional(v.string()),
    displays: v.optional(v.array(displayValidator)),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    await rateLimiter.limit(ctx, "chatTurn", { key: userId, throws: true });

    if (args.userMessage.length > MAX_USER_MESSAGE_LEN) {
      throw new Error(`userMessage exceeds ${MAX_USER_MESSAGE_LEN} chars`);
    }
    if (args.assistantMessage.length > MAX_ASSISTANT_MESSAGE_LEN) {
      throw new Error(
        `assistantMessage exceeds ${MAX_ASSISTANT_MESSAGE_LEN} chars`,
      );
    }
    if (args.displays && args.displays.length > MAX_DISPLAYS) {
      throw new Error(`Too many displays (max ${MAX_DISPLAYS})`);
    }

    const thread = await ctx.db.get(args.threadId);
    if (!thread || thread.userId !== userId) {
      throw new Error("Thread not found");
    }
    const now = Date.now();
    await ctx.db.insert("chatMessages", {
      userId,
      threadId: args.threadId,
      role: "user",
      content: args.userMessage,
      pageContext: args.pageContext,
      createdAt: now,
    });
    await ctx.db.insert("chatMessages", {
      userId,
      threadId: args.threadId,
      role: "assistant",
      content: args.assistantMessage,
      pageContext: args.pageContext,
      createdAt: now + 1,
      displays: args.displays,
    });

    const patch: { lastMessageAt: number; title?: string } = {
      lastMessageAt: now + 1,
    };
    if (thread.title === "New chat") {
      patch.title = autoTitle(args.userMessage);
    }
    await ctx.db.patch(args.threadId, patch);
  },
});

function autoTitle(message: string): string {
  const clean = message.replace(/\s+/g, " ").trim();
  if (!clean) return "New chat";
  const words = clean.split(" ").slice(0, 6).join(" ");
  return words.length > 48 ? words.slice(0, 45) + "…" : words;
}
