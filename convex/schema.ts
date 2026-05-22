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
    durationSec: v.optional(v.number()),
    notes: v.optional(v.string()),
  })
    .index("by_user_exercise_date", ["userId", "exerciseSlug", "date"])
    .index("by_user_date", ["userId", "date"]),

  insights: defineTable({
    userId: v.id("users"),
    datasetVersion: v.number(),
    kind: v.union(
      v.literal("overview"),
      v.literal("exercise"),
      v.literal("plateau"),
      v.literal("balance"),
      v.literal("streak"),
    ),
    scope: v.optional(v.string()),
    content: v.string(),
    generatedAt: v.number(),
    model: v.string(),
  }).index("by_user_version_kind", ["userId", "datasetVersion", "kind"]),

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
  })
    .index("by_user_created", ["userId", "createdAt"])
    .index("by_thread_created", ["threadId", "createdAt"]),

  bodyMeasurements: defineTable({
    userId: v.id("users"),
    date: v.number(),
    weightKg: v.optional(v.number()),
    bodyFatPct: v.optional(v.number()),
    measurements: v.optional(v.record(v.string(), v.number())),
  }).index("by_user_date", ["userId", "date"]),
});
