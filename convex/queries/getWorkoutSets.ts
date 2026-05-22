import { v } from "convex/values";
import { query } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export default query({
  args: {
    exerciseSlug: v.optional(v.string()),
    dateStart: v.optional(v.number()),
    dateEnd: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return [];

    const limit = args.limit ?? 5000;
    const { dateStart, dateEnd, exerciseSlug } = args;

    if (exerciseSlug) {
      return await ctx.db
        .query("workoutSets")
        .withIndex("by_user_exercise_date", (q) => {
          const base = q.eq("userId", userId).eq("exerciseSlug", exerciseSlug);
          if (dateStart !== undefined && dateEnd !== undefined) {
            return base.gte("date", dateStart).lte("date", dateEnd);
          }
          if (dateStart !== undefined) return base.gte("date", dateStart);
          if (dateEnd !== undefined) return base.lte("date", dateEnd);
          return base;
        })
        .take(limit);
    }

    return await ctx.db
      .query("workoutSets")
      .withIndex("by_user_date", (q) => {
        const base = q.eq("userId", userId);
        if (dateStart !== undefined && dateEnd !== undefined) {
          return base.gte("date", dateStart).lte("date", dateEnd);
        }
        if (dateStart !== undefined) return base.gte("date", dateStart);
        if (dateEnd !== undefined) return base.lte("date", dateEnd);
        return base;
      })
      .take(limit);
  },
});
