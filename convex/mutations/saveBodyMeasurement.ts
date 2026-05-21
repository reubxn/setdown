import { v } from "convex/values";
import { mutation } from "../_generated/server";

export default mutation({
  args: {
    date: v.number(),
    weightKg: v.optional(v.number()),
    bodyFatPct: v.optional(v.number()),
    measurements: v.optional(v.record(v.string(), v.number())),
  },
  handler: async () => {
    // implemented in phase 1 — see track 1.9
    throw new Error("not implemented");
  },
});
