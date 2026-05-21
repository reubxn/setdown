import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export default mutation({
  args: {
    sourceFilename: v.string(),
    sets: v.array(
      v.object({
        date: v.number(),
        exerciseName: v.string(),
        exerciseSlug: v.string(),
        setOrder: v.number(),
        weightKg: v.number(),
        reps: v.number(),
        rpe: v.optional(v.number()),
        durationSec: v.optional(v.number()),
        notes: v.optional(v.string()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("not authenticated");

    const existing = await ctx.db
      .query("datasets")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    for (const ds of existing) {
      const oldSets = await ctx.db
        .query("workoutSets")
        .withIndex("by_user_date", (q) => q.eq("userId", userId))
        .filter((q) => q.eq(q.field("datasetId"), ds._id))
        .collect();
      for (const s of oldSets) await ctx.db.delete(s._id);
      await ctx.db.delete(ds._id);
    }

    const dates = args.sets.map((s) => s.date);
    const start = dates.length ? Math.min(...dates) : Date.now();
    const end = dates.length ? Math.max(...dates) : Date.now();
    const version = (existing[0]?.version ?? 0) + 1;

    const datasetId = await ctx.db.insert("datasets", {
      userId,
      uploadedAt: Date.now(),
      sourceFilename: args.sourceFilename,
      rowCount: args.sets.length,
      dateRange: { start, end },
      version,
    });

    for (const s of args.sets) {
      await ctx.db.insert("workoutSets", {
        userId,
        datasetId,
        date: s.date,
        exerciseName: s.exerciseName,
        exerciseSlug: s.exerciseSlug,
        setOrder: s.setOrder,
        weightKg: s.weightKg,
        reps: s.reps,
        rpe: s.rpe,
        durationSec: s.durationSec,
        notes: s.notes,
      });
    }

    return { datasetId, version, rowCount: args.sets.length };
  },
});
