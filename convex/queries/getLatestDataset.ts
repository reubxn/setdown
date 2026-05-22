import { query } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export default query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;

    const datasets = await ctx.db
      .query("datasets")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    if (datasets.length === 0) return null;

    return datasets.reduce((latest, d) =>
      d.version > latest.version ? d : latest,
    );
  },
});
