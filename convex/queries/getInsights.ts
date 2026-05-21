import { v } from "convex/values";
import { query } from "../_generated/server";

export default query({
  args: {
    kind: v.union(
      v.literal("overview"),
      v.literal("exercise"),
      v.literal("plateau"),
      v.literal("balance"),
      v.literal("streak"),
    ),
    scope: v.optional(v.string()),
  },
  handler: async () => {
    // implemented in phase 1 — see track 1.8
    return null;
  },
});
