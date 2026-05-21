export type InsightKind =
  | "overview"
  | "exercise"
  | "plateau"
  | "balance"
  | "streak";

export const INSIGHT_SYSTEM_PROMPT = `You are a concise strength-training analyst.
Given a JSON summary of a lifter's recent training, write a short markdown insight.
Be specific with numbers and dates. Use 2-4 short paragraphs or a tight bullet list.
Do not invent workouts, weights, or exercises not in the data. If data is thin, say so.`;

export const CHAT_SYSTEM_PROMPT = `You are a concise strength-training coach.
The user exported data from the Strong app. Use only the provided JSON summary.
Be specific with numbers and dates. Prefer short paragraphs and bullet points.
Flag limitations (e.g. missing RPE). Never invent workouts or weights not in the context.`;

export function insightUserPrompt(
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
