import { mutation } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { rateLimiter } from "../rateLimits";

export default mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");

    await rateLimiter.limit(ctx, "deleteAccount", {
      key: userId,
      throws: true,
    });

    const sets = await ctx.db
      .query("workoutSets")
      .withIndex("by_user_date", (q) => q.eq("userId", userId))
      .collect();
    for (const s of sets) await ctx.db.delete(s._id);

    const datasets = await ctx.db
      .query("datasets")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    for (const d of datasets) await ctx.db.delete(d._id);

    const chats = await ctx.db
      .query("chatMessages")
      .withIndex("by_user_created", (q) => q.eq("userId", userId))
      .collect();
    for (const c of chats) await ctx.db.delete(c._id);

    const threads = await ctx.db
      .query("chatThreads")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    for (const t of threads) await ctx.db.delete(t._id);

    await ctx.db.delete(userId);

    return { ok: true };
  },
});
