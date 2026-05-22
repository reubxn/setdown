import { query } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Drop Convex-internal fields so the returned export blob doesn't carry stable
// internal identifiers a user might paste into a public bug report or share.
function stripIds<T extends { _id?: unknown; _creationTime?: unknown; userId?: unknown }>(
  row: T,
): Omit<T, "_id" | "_creationTime" | "userId"> {
  const { _id: _id, _creationTime: _creationTime, userId: _userId, ...rest } = row;
  void _id;
  void _creationTime;
  void _userId;
  return rest;
}

export default query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");

    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    const datasets = await ctx.db
      .query("datasets")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const workoutSets = await ctx.db
      .query("workoutSets")
      .withIndex("by_user_date", (q) => q.eq("userId", userId))
      .collect();

    const insights = await ctx.db
      .query("insights")
      .withIndex("by_user_version_kind", (q) => q.eq("userId", userId))
      .collect();

    const chatMessages = await ctx.db
      .query("chatMessages")
      .withIndex("by_user_created", (q) => q.eq("userId", userId))
      .collect();

    const bodyMeasurements = await ctx.db
      .query("bodyMeasurements")
      .withIndex("by_user_date", (q) => q.eq("userId", userId))
      .collect();

    return {
      exportedAt: Date.now(),
      user: {
        name: user.name ?? null,
        email: user.email ?? null,
        image: user.image ?? null,
        createdAt: user.createdAt ?? null,
      },
      datasets: datasets.map(stripIds),
      workoutSets: workoutSets.map(stripIds),
      insights: insights.map(stripIds),
      chatMessages: chatMessages.map(stripIds),
      bodyMeasurements: bodyMeasurements.map(stripIds),
    };
  },
});
