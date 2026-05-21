"use node";

import Anthropic from "@anthropic-ai/sdk";
import { v } from "convex/values";
import { action } from "../_generated/server";
import { api, internal } from "../_generated/api";
import { rateLimiter } from "../rateLimits";

type InsightKind = "overview" | "exercise" | "plateau" | "balance" | "streak";

const INSIGHT_SYSTEM_PROMPT = `You are a concise strength-training analyst.
Given a JSON summary of a lifter's recent training, write a short markdown insight.
Be specific with numbers and dates. Use 2-4 short paragraphs or a tight bullet list.
Do not invent workouts, weights, or exercises not in the data. If data is thin, say so.`;

function insightUserPrompt(
  kind: InsightKind,
  context: unknown,
  scope?: string,
): string {
  const payload = `Training data summary:\n\`\`\`json\n${JSON.stringify(context, null, 2)}\n\`\`\``;
  switch (kind) {
    case "overview":
      return `${payload}\n\nWrite a 3-sentence overview of how the user has trained recently. Lead with the headline (volume change, frequency). Mention one specific PR if available.`;
    case "plateau":
      return `${payload}\n\nIdentify up to 3 lifts that look like they may be plateauing (flat max weight or volume for 4+ weeks). For each, give one concrete suggestion. If nothing is clearly plateauing, say so.`;
    case "balance":
      return `${payload}\n\nLooking at the top exercises by volume, comment on push/pull/leg balance. Flag any obvious imbalance. Keep it to 2-3 sentences.`;
    case "streak":
      return `${payload}\n\nIn 1-2 sentences, comment on training consistency: workouts per week, gaps, momentum.`;
    case "exercise":
      return `${payload}\n\nGive a focused analysis of ${scope ?? "the highlighted exercise"}: progression, recent PR, suggested next step. 2-3 short paragraphs.`;
  }
}

const KINDS: InsightKind[] = ["overview", "plateau", "balance", "streak"];
const MODEL = "claude-sonnet-4-20250514";
const MAX_TOKENS = 700;

interface SetWithVolume {
  date: number;
  exerciseName: string;
  weightKg: number;
  reps: number;
  volume: number;
}

function summarize(sets: SetWithVolume[]) {
  if (sets.length === 0) return null;
  const dates = sets.map((s) => s.date);
  const start = Math.min(...dates);
  const end = Math.max(...dates);

  const fourWeeksMs = 28 * 24 * 60 * 60 * 1000;
  const last4Cutoff = end - fourWeeksMs;
  const prior4Cutoff = last4Cutoff - fourWeeksMs;

  const last4 = sets.filter((s) => s.date >= last4Cutoff);
  const prior4 = sets.filter(
    (s) => s.date >= prior4Cutoff && s.date < last4Cutoff,
  );

  const volumeLast4 = last4.reduce((sum, s) => sum + s.volume, 0);
  const volumePrior4 = prior4.reduce((sum, s) => sum + s.volume, 0);
  const volumeChangePercent =
    volumePrior4 > 0
      ? Math.round(((volumeLast4 - volumePrior4) / volumePrior4) * 1000) / 10
      : 0;

  const sessionsLast4 = new Set(
    last4.map((s) => new Date(s.date).toISOString().slice(0, 10)),
  ).size;
  const totalSessions = new Set(
    sets.map((s) => new Date(s.date).toISOString().slice(0, 10)),
  ).size;
  const weeks = Math.max(
    1,
    Math.round((end - start) / (7 * 24 * 60 * 60 * 1000)),
  );
  const workoutsPerWeekAvg = Math.round((totalSessions / weeks) * 100) / 100;

  const volByExercise = new Map<string, number>();
  for (const s of last4) {
    volByExercise.set(
      s.exerciseName,
      (volByExercise.get(s.exerciseName) ?? 0) + s.volume,
    );
  }
  const topExercisesByVolume = [...volByExercise.entries()]
    .map(([name, volume]) => ({ name, volume: Math.round(volume) }))
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 10);

  const maxByExercise = new Map<
    string,
    { weight: number; reps: number; date: number }
  >();
  for (const s of sets) {
    if (s.weightKg <= 0) continue;
    const prev = maxByExercise.get(s.exerciseName);
    if (!prev || s.weightKg > prev.weight) {
      maxByExercise.set(s.exerciseName, {
        weight: s.weightKg,
        reps: s.reps,
        date: s.date,
      });
    }
  }
  const recentPRs = [...maxByExercise.entries()]
    .map(([exercise, info]) => ({
      exercise,
      metric: `Max weight (${info.reps} reps)`,
      value: info.weight,
      date: new Date(info.date).toISOString().slice(0, 10),
    }))
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 15);

  return {
    dateRange: {
      start: new Date(start).toISOString().slice(0, 10),
      end: new Date(end).toISOString().slice(0, 10),
    },
    totalSessions,
    sessionsLast4Weeks: sessionsLast4,
    volumeLast4Weeks: Math.round(volumeLast4),
    volumePrior4Weeks: Math.round(volumePrior4),
    volumeChangePercent,
    workoutsPerWeekAvg,
    topExercisesByVolume,
    recentPRs,
  };
}

async function runOne(
  client: Anthropic,
  kind: InsightKind,
  context: unknown,
  scope?: string,
): Promise<string> {
  const res = await client.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: INSIGHT_SYSTEM_PROMPT,
    messages: [
      { role: "user", content: insightUserPrompt(kind, context, scope) },
    ],
  });
  const text = res.content
    .map((c) => (c.type === "text" ? c.text : ""))
    .join("")
    .trim();
  return text || "_No insight produced._";
}

interface WorkoutSetRow {
  date: number;
  exerciseName: string;
  weightKg: number;
  reps: number;
}

export default action({
  args: {
    datasetVersion: v.optional(v.number()),
    force: v.optional(v.boolean()),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{ generated: number; cached: number }> => {
    const userInfo: { _id: string } | null = await ctx.runQuery(
      api.queries.getCurrentUser.default,
      {},
    );
    if (!userInfo) throw new Error("Not authenticated");

    await rateLimiter.limit(ctx, "generateInsights", {
      key: userInfo._id,
      throws: true,
    });

    const dataset = (await ctx.runQuery(
      api.queries.getLatestDataset.default,
      {},
    )) as { version: number } | null;
    if (!dataset) throw new Error("No dataset");

    const datasetVersion = args.datasetVersion ?? dataset.version;
    const force = args.force ?? false;

    const existing: Array<{ kind: InsightKind }> = await ctx.runQuery(
      internal.ai.insight_storage.listForVersion,
      { datasetVersion },
    );
    const existingKinds = new Set(existing.map((i) => i.kind));

    const rows: WorkoutSetRow[] = await ctx.runQuery(
      api.queries.getWorkoutSets.default,
      { limit: 5000 },
    );
    const sets: SetWithVolume[] = rows.map((r) => ({
      date: r.date,
      exerciseName: r.exerciseName,
      weightKg: r.weightKg,
      reps: r.reps,
      volume: r.weightKg * r.reps,
    }));
    const context = summarize(sets);
    if (!context) return { generated: 0, cached: 0 };

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY not configured");
    const client = new Anthropic({ apiKey });

    let generated = 0;
    let cached = 0;
    for (const kind of KINDS) {
      if (!force && existingKinds.has(kind)) {
        cached++;
        continue;
      }
      const content = await runOne(client, kind, context);
      await ctx.runMutation(internal.ai.insight_storage.writeInsight, {
        datasetVersion,
        kind,
        content,
        model: MODEL,
      });
      generated++;
    }

    return { generated, cached };
  },
});
