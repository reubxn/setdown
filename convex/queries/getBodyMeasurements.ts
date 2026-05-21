import { query } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export default query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return [];

    const rows = await ctx.db
      .query("bodyMeasurements")
      .withIndex("by_user_date", (q) => q.eq("userId", userId))
      .collect();

    return rows
      .map((r) => ({
        _id: r._id,
        date: r.date,
        weightKg: r.weightKg ?? null,
        bodyFatPct: r.bodyFatPct ?? null,
        measurements: r.measurements ?? {},
      }))
      .sort((a, b) => a.date - b.date);
  },
});
