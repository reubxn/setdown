import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export default mutation({
  args: {
    date: v.number(),
    weightKg: v.optional(v.number()),
    bodyFatPct: v.optional(v.number()),
    measurements: v.optional(v.record(v.string(), v.number())),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("not authenticated");

    const id = await ctx.db.insert("bodyMeasurements", {
      userId,
      date: args.date,
      weightKg: args.weightKg,
      bodyFatPct: args.bodyFatPct,
      measurements: args.measurements,
    });
    return id;
  },
});
