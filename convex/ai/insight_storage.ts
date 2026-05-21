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
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const rows = await ctx.db
      .query("chatMessages")
      .withIndex("by_user_created", (q) => q.eq("userId", userId))
      .order("desc")
      .take(limit ?? 50);
    return rows.reverse().map((r) => ({
      _id: r._id,
      role: r.role,
      content: r.content,
      createdAt: r.createdAt,
      pageContext: r.pageContext ?? null,
    }));
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
    userMessage: v.string(),
    assistantMessage: v.string(),
    pageContext: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const now = Date.now();
    await ctx.db.insert("chatMessages", {
      userId,
      role: "user",
      content: args.userMessage,
      pageContext: args.pageContext,
      createdAt: now,
    });
    await ctx.db.insert("chatMessages", {
      userId,
      role: "assistant",
      content: args.assistantMessage,
      pageContext: args.pageContext,
      createdAt: now + 1,
    });
  },
});
