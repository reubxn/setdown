import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,

  users: defineTable({
    // fields populated by @convex-dev/auth on sign-in
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    image: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    // app-specific
    createdAt: v.optional(v.number()),
  })
    .index("email", ["email"])
    .index("phone", ["phone"]),

  datasets: defineTable({
    userId: v.id("users"),
    uploadedAt: v.number(),
    sourceFilename: v.string(),
    rowCount: v.number(),
    dateRange: v.object({ start: v.number(), end: v.number() }),
    version: v.number(),
  }).index("by_user", ["userId"]),

  workoutSets: defineTable({
    userId: v.id("users"),
    datasetId: v.id("datasets"),
    date: v.number(),
    exerciseName: v.string(),
    exerciseSlug: v.string(),
    setOrder: v.number(),
    weightKg: v.number(),
    reps: v.number(),
    rpe: v.optional(v.number()),
    // Per-set duration in seconds (distance/time exercises, e.g. plank).
    // Distinct from `sessionDurationMinutes` below, which is the whole workout.
    durationSec: v.optional(v.number()),
    notes: v.optional(v.string()),
    // Optional set classification used by AI tools to filter warmups out
    // of volume calculations. Legacy rows without this default to "working"
    // at read time.
    setType: v.optional(
      v.union(
        v.literal("warmup"),
        v.literal("working"),
        v.literal("dropset"),
        v.literal("failure"),
        v.literal("unknown"),
      ),
    ),
    // Name of the parent workout session (e.g. "Push Day").
    workoutName: v.optional(v.string()),
    // Duration of the whole workout session in minutes (same value on every
    // set belonging to that session). Not to be confused with `durationSec`.
    sessionDurationMinutes: v.optional(v.number()),
  })
    .index("by_user_exercise_date", ["userId", "exerciseSlug", "date"])
    .index("by_user_date", ["userId", "date"]),

  chatThreads: defineTable({
    userId: v.id("users"),
    title: v.string(),
    createdAt: v.number(),
    lastMessageAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_last", ["userId", "lastMessageAt"]),

  chatMessages: defineTable({
    userId: v.id("users"),
    threadId: v.optional(v.id("chatThreads")),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    createdAt: v.number(),
    pageContext: v.optional(v.string()),
    // Inline UI payloads rendered alongside the assistant's text. Shape is
    // validated client-side against lib/ai/display.ChatDisplay.
    displays: v.optional(v.array(v.any())),
  })
    .index("by_user_created", ["userId", "createdAt"])
    .index("by_thread_created", ["threadId", "createdAt"]),
});
