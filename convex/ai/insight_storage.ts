import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import {
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "../_generated/server";

const KIND = v.union(
  v.literal("overview"),
  v.literal("exercise"),
  v.literal("plateau"),
  v.literal("balance"),
  v.literal("streak"),
);

export const listForVersion = internalQuery({
  args: { datasetVersion: v.number() },
  handler: async (ctx, { datasetVersion }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const rows = await ctx.db
      .query("insights")
      .withIndex("by_user_version_kind", (q) =>
        q.eq("userId", userId).eq("datasetVersion", datasetVersion),
      )
      .collect();
    return rows.map((r) => ({
      _id: r._id,
      kind: r.kind,
      scope: r.scope ?? null,
      content: r.content,
      generatedAt: r.generatedAt,
      model: r.model,
    }));
  },
});

export const writeInsight = internalMutation({
  args: {
    datasetVersion: v.number(),
    kind: KIND,
    content: v.string(),
    model: v.string(),
    scope: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const existing = await ctx.db
      .query("insights")
      .withIndex("by_user_version_kind", (q) =>
        q
          .eq("userId", userId)
          .eq("datasetVersion", args.datasetVersion)
          .eq("kind", args.kind),
      )
      .collect();
    for (const row of existing) {
      if ((row.scope ?? undefined) === args.scope) {
        await ctx.db.delete(row._id);
      }
    }
    await ctx.db.insert("insights", {
      userId,
      datasetVersion: args.datasetVersion,
      kind: args.kind,
      scope: args.scope,
      content: args.content,
      generatedAt: Date.now(),
      model: args.model,
    });
  },
});

export const getInsightsForCurrentDataset = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const dataset = await ctx.db
      .query("datasets")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .first();
    if (!dataset) return null;
    const rows = await ctx.db
      .query("insights")
      .withIndex("by_user_version_kind", (q) =>
        q.eq("userId", userId).eq("datasetVersion", dataset.version),
      )
      .collect();
    return {
      datasetVersion: dataset.version,
      insights: rows.map((r) => ({
        kind: r.kind,
        scope: r.scope ?? null,
        content: r.content,
        generatedAt: r.generatedAt,
        model: r.model,
      })),
    };
  },
});

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
    const now = Date.now();
    const id = await ctx.db.insert("chatThreads", {
      userId,
      title: title?.trim() || "New chat",
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
    const thread = await ctx.db.get(threadId);
    if (!thread || thread.userId !== userId) throw new Error("Not found");
    await ctx.db.patch(threadId, { title: title.trim() || "New chat" });
  },
});

export const deleteThread = mutation({
  args: { threadId: v.id("chatThreads") },
  handler: async (ctx, { threadId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
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
    if (!userId) return { used: 0, limit: 50 };
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
    return { used: userMsgs, limit: 50 };
  },
});

export const recordChatTurn = mutation({
  args: {
    threadId: v.id("chatThreads"),
    userMessage: v.string(),
    assistantMessage: v.string(),
    pageContext: v.optional(v.string()),
    displays: v.optional(v.array(v.any())),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
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
