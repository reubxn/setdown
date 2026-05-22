import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { rateLimiter } from "../rateLimits";

const MAX_MEASUREMENT_KEYS = 32;
const MAX_MEASUREMENT_KEY_LEN = 64;

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

    await rateLimiter.limit(ctx, "saveBodyMeasurement", {
      key: userId,
      throws: true,
    });

    const nowMs = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    if (!Number.isFinite(args.date) || args.date < 0 || args.date > nowMs + dayMs) {
      throw new Error("date out of range");
    }
    if (
      args.weightKg !== undefined &&
      (!Number.isFinite(args.weightKg) || args.weightKg < 0 || args.weightKg > 1000)
    ) {
      throw new Error("weightKg out of range");
    }
    if (
      args.bodyFatPct !== undefined &&
      (!Number.isFinite(args.bodyFatPct) ||
        args.bodyFatPct < 0 ||
        args.bodyFatPct > 100)
    ) {
      throw new Error("bodyFatPct out of range");
    }
    if (args.measurements) {
      const entries = Object.entries(args.measurements);
      if (entries.length > MAX_MEASUREMENT_KEYS) {
        throw new Error(`Too many measurement keys (max ${MAX_MEASUREMENT_KEYS})`);
      }
      for (const [key, val] of entries) {
        if (key.length > MAX_MEASUREMENT_KEY_LEN) {
          throw new Error(
            `measurement key exceeds ${MAX_MEASUREMENT_KEY_LEN} chars`,
          );
        }
        if (!Number.isFinite(val) || val < 0 || val > 1000) {
          throw new Error(`measurement "${key}" out of range`);
        }
      }
    }

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
