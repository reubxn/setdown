"use node";

import { v } from "convex/values";
import { action } from "../_generated/server";

export default action({
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
    // calls Claude, writes to `insights` table
    throw new Error("not implemented");
  },
});
