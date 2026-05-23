import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { rateLimiter } from "../rateLimits";

const MAX_SETS = 100_000;
const MAX_FILENAME = 256;
const MAX_EXERCISE_NAME = 200;
const MAX_EXERCISE_SLUG = 200;
const MAX_NOTES = 2000;
const MAX_WEIGHT_KG = 10_000;
const MAX_REPS = 10_000;
const MAX_SET_ORDER = 1000;
const MAX_DURATION_SEC = 86_400;

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

    await rateLimiter.limit(ctx, "uploadDataset", { key: userId, throws: true });

    if (args.sourceFilename.length > MAX_FILENAME) {
      throw new Error(`sourceFilename exceeds ${MAX_FILENAME} chars`);
    }
    if (args.sets.length > MAX_SETS) {
      throw new Error(`Too many sets (max ${MAX_SETS})`);
    }
    const nowMs = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const minDate = 0;
    const maxDate = nowMs + dayMs;
    for (const s of args.sets) {
      if (s.exerciseName.length > MAX_EXERCISE_NAME) {
        throw new Error(`exerciseName exceeds ${MAX_EXERCISE_NAME} chars`);
      }
      if (s.exerciseSlug.length > MAX_EXERCISE_SLUG) {
        throw new Error(`exerciseSlug exceeds ${MAX_EXERCISE_SLUG} chars`);
      }
      if (s.notes !== undefined && s.notes.length > MAX_NOTES) {
        throw new Error(`notes exceeds ${MAX_NOTES} chars`);
      }
      if (
        !Number.isFinite(s.date) ||
        s.date < minDate ||
        s.date > maxDate
      ) {
        throw new Error("date out of range");
      }
      if (
        !Number.isFinite(s.weightKg) ||
        s.weightKg < 0 ||
        s.weightKg > MAX_WEIGHT_KG
      ) {
        throw new Error("weightKg out of range");
      }
      if (!Number.isFinite(s.reps) || s.reps < 0 || s.reps > MAX_REPS) {
        throw new Error("reps out of range");
      }
      if (
        !Number.isFinite(s.setOrder) ||
        s.setOrder < 0 ||
        s.setOrder > MAX_SET_ORDER
      ) {
        throw new Error("setOrder out of range");
      }
      if (
        s.rpe !== undefined &&
        (!Number.isFinite(s.rpe) || s.rpe < 0 || s.rpe > 10)
      ) {
        throw new Error("rpe out of range");
      }
      if (
        s.durationSec !== undefined &&
        (!Number.isFinite(s.durationSec) ||
          s.durationSec < 0 ||
          s.durationSec > MAX_DURATION_SEC)
      ) {
        throw new Error("durationSec out of range");
      }
    }

    const existing = await ctx.db
      .query("datasets")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const nextVersion =
      existing.reduce((max, ds) => Math.max(max, ds.version), 0) + 1;

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

    const datasetId = await ctx.db.insert("datasets", {
      userId,
      uploadedAt: Date.now(),
      sourceFilename: args.sourceFilename,
      rowCount: args.sets.length,
      dateRange: { start, end },
      version: nextVersion,
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

    return { datasetId, version: nextVersion, rowCount: args.sets.length };
  },
});
