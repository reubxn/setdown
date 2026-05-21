import { v } from "convex/values";
import { mutation } from "../_generated/server";

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
  handler: async () => {
    // implemented in phase 1 — see track 1.4
    throw new Error("not implemented");
  },
});
