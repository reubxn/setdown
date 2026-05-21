import { v } from "convex/values";
import { query } from "../_generated/server";

export default query({
  args: {
    exerciseSlug: v.optional(v.string()),
    dateStart: v.optional(v.number()),
    dateEnd: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async () => {
    // implemented in phase 1 — paginated, filterable by date range / exercise
    return [];
  },
});
