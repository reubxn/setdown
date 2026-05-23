// Fetches everything the AI chat route needs to reconstruct a WorkoutDataset
// server-side. Returns `null` when there's no authed user or no dataset.
//
// We cap the row count at MAX_SETS to avoid runaway responses for users with
// pathological histories.

import { query } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

const MAX_SETS = 50_000;

export default query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;

    // Latest dataset = highest version.
    const datasets = await ctx.db
      .query("datasets")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    if (datasets.length === 0) return null;
    const latest = datasets.reduce((acc, d) =>
      d.version > acc.version ? d : acc,
    );

    // Pull every set for the user in date order. The index is already by
    // (userId, date), so this is a single in-order scan.
    const sets = await ctx.db
      .query("workoutSets")
      .withIndex("by_user_date", (q) => q.eq("userId", userId))
      .take(MAX_SETS);

    return {
      meta: {
        importedAt: latest.uploadedAt,
        fileName: latest.sourceFilename,
        dateRange: latest.dateRange,
        totalSets: latest.rowCount,
      },
      sets,
    };
  },
});
