import { v } from "convex/values";
import { mutation } from "../_generated/server";

export default mutation({
  args: {
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    pageContext: v.optional(v.string()),
  },
  handler: async () => {
    // implemented in phase 1 — see track 1.8
    throw new Error("not implemented");
  },
});
