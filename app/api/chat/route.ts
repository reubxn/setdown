import Anthropic from "@anthropic-ai/sdk";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { CHAT_SYSTEM_PROMPT } from "@/lib/ai/insight-prompts";
import {
  TOOL_DEFINITIONS,
  rehydrateDataset,
  runTool,
  type BodyMeasurement,
  type SerializedWorkoutDataset,
} from "@/lib/ai/tools";
import type { ChatDisplay } from "@/lib/ai/display";

const DAILY_LIMIT = 50;
const MAX_BODY_BYTES = 1_500_000; // ~1.5 MB — enough to fit a season of training
const MAX_TOOL_TURNS = 6;
const MAX_HISTORY_CHARS = 4096;
const MODEL = "claude-sonnet-4-6";

export const maxDuration = 60;

export async function POST(request: Request) {
  // Reject cross-origin browser requests outright. Bearer-token auth already
  // covers CSRF for cookie-less flows, but an origin pin is cheap defense
  // against a stolen token being replayed from an attacker page.
  const requestUrl = new URL(request.url);
  const origin = request.headers.get("origin");
  if (origin) {
    try {
      if (new URL(origin).host !== requestUrl.host) {
        return Response.json({ error: "Forbidden" }, { status: 403 });
      }
    } catch {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const auth = request.headers.get("authorization") ?? "";
  const token = auth.toLowerCase().startsWith("bearer ")
    ? auth.slice(7).trim()
    : null;
  if (!token) {
    return Response.json(
      { error: "Sign in to chat with AI." },
      { status: 401 },
    );
  }

  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    return Response.json(
      { error: "AI is currently unavailable." },
      { status: 503 },
    );
  }

  const convex = new ConvexHttpClient(convexUrl);
  convex.setAuth(token);

  let user: { _id: string } | null;
  try {
    user = await convex.query(api.queries.getCurrentUser.default, {});
  } catch {
    return Response.json({ error: "Not authenticated." }, { status: 401 });
  }
  if (!user) {
    return Response.json({ error: "Not authenticated." }, { status: 401 });
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return Response.json(
      { error: "Content-Type must be application/json" },
      { status: 400 },
    );
  }

  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) {
    return Response.json({ error: "Request body too large" }, { status: 413 });
  }

  let body: {
    message?: string;
    threadId?: string;
    pageContext?: string;
    dataset?: SerializedWorkoutDataset;
  };
  try {
    body = JSON.parse(raw);
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { message, threadId, pageContext, dataset: serializedDataset } = body;
  if (!message?.trim() || !threadId || !serializedDataset) {
    return Response.json(
      { error: "message, threadId, and dataset are required" },
      { status: 400 },
    );
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    // Don't echo the env-var name to clients; log server-side instead.
    console.error("ANTHROPIC_API_KEY missing");
    return Response.json(
      { error: "AI is currently unavailable." },
      { status: 503 },
    );
  }

  // Reserves one unit of the chatRequest rate-limit bucket and verifies the
  // caller is under the daily cap. Throws "daily_limit" if the user has hit
  // the day cap, or a rate-limit error otherwise.
  try {
    await convex.mutation(api.ai.insight_storage.reserveChatTurn, {});
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg.includes("daily_limit")) {
      return Response.json(
        { error: `Daily limit reached (${DAILY_LIMIT} messages).` },
        { status: 429 },
      );
    }
    return Response.json(
      { error: "Too many requests. Try again later." },
      { status: 429 },
    );
  }

  const typedThreadId = threadId as Id<"chatThreads">;
  const priorMessages = await convex.query(
    api.ai.insight_storage.listChatMessages,
    { limit: 20, threadId: typedThreadId },
  );

  const bodyMeasurementsRaw = (await convex
    .query(api.queries.getBodyMeasurements.default, {})
    .catch(() => [])) as Array<{
    date: number;
    weightKg: number | null;
    bodyFatPct: number | null;
    measurements: Record<string, number>;
  }>;
  const bodyMeasurements: BodyMeasurement[] = bodyMeasurementsRaw.map((m) => ({
    date: m.date,
    weightKg: m.weightKg,
    bodyFatPct: m.bodyFatPct,
    measurements: m.measurements ?? {},
  }));

  const dataset = rehydrateDataset(serializedDataset);

  // Truncate stored message content before re-feeding into the model so a
  // poisoned history can't multiply token cost across turns.
  const history = priorMessages
    .filter((m) => m.content.trim().length > 0)
    .slice(-10)
    .map((m) => ({
      role: m.role,
      content:
        m.content.length > MAX_HISTORY_CHARS
          ? m.content.slice(0, MAX_HISTORY_CHARS) + "…"
          : m.content,
    })) as Anthropic.MessageParam[];

  const client = new Anthropic({ apiKey });

  // Compact summary of the dataset, included once at the start of the user
  // turn so the model has just enough context to decide which tools to call.
  const datasetSummary = {
    dateRange: {
      start: dataset.dateRange.start.toISOString().slice(0, 10),
      end: dataset.dateRange.end.toISOString().slice(0, 10),
    },
    totalSessions: dataset.sessions.length,
    exerciseCount: dataset.exercises.length,
    pageContext: pageContext ?? null,
  };

  const messages: Anthropic.MessageParam[] = [
    ...history,
    {
      role: "user",
      content: `Dataset overview (call tools for details):\n\`\`\`json\n${JSON.stringify(datasetSummary)}\n\`\`\`\n\nQuestion: ${message.trim()}`,
    },
  ];

  const encoder = new TextEncoder();

  // NDJSON event protocol: each line is a JSON object of shape
  //   { type: "text", value: string }
  //   { type: "display", value: ChatDisplay }
  //   { type: "error", value: string }
  // Stream is consumed by components/ai/chat-panel.tsx.
  type ChatEvent =
    | { type: "text"; value: string }
    | { type: "display"; value: ChatDisplay }
    | { type: "error"; value: string };

  const readable = new ReadableStream({
    async start(controller) {
      let assistantText = "";
      const collectedDisplays: ChatDisplay[] = [];

      const send = (evt: ChatEvent) => {
        controller.enqueue(encoder.encode(JSON.stringify(evt) + "\n"));
      };

      try {
        for (let turn = 0; turn < MAX_TOOL_TURNS; turn++) {
          const stream = client.messages.stream({
            model: MODEL,
            max_tokens: 1500,
            system: [
              {
                type: "text",
                text: CHAT_SYSTEM_PROMPT,
                cache_control: { type: "ephemeral" },
              },
            ],
            tools: TOOL_DEFINITIONS.map((t, i) =>
              // Mark the final tool with cache_control so the whole tool block
              // is cached together with the system prompt.
              i === TOOL_DEFINITIONS.length - 1
                ? { ...t, cache_control: { type: "ephemeral" } }
                : t,
            ) as Anthropic.Tool[],
            messages,
          });

          for await (const event of stream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              assistantText += event.delta.text;
              send({ type: "text", value: event.delta.text });
            }
          }

          const finalMessage = await stream.finalMessage();
          messages.push({
            role: "assistant",
            content: finalMessage.content,
          });

          const toolUses = finalMessage.content.filter(
            (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
          );

          if (
            finalMessage.stop_reason !== "tool_use" ||
            toolUses.length === 0
          ) {
            break;
          }

          // Optionally surface "Claude is looking up X" hints inline.
          for (const use of toolUses) {
            const hint = `\n\n_…fetching ${humanizeTool(use.name)}…_\n\n`;
            send({ type: "text", value: hint });
            assistantText += hint;
          }

          const toolResults: Anthropic.ToolResultBlockParam[] = toolUses.map(
            (use) => {
              try {
                const result = runTool(use.name, use.input, {
                  dataset,
                  bodyMeasurements,
                });
                if (result.display) {
                  collectedDisplays.push(result.display);
                  send({ type: "display", value: result.display });
                }
                return {
                  type: "tool_result",
                  tool_use_id: use.id,
                  content: JSON.stringify(result.payload),
                };
              } catch (err) {
                return {
                  type: "tool_result",
                  tool_use_id: use.id,
                  is_error: true,
                  content:
                    err instanceof Error ? err.message : "Tool execution failed",
                };
              }
            },
          );

          messages.push({ role: "user", content: toolResults });
        }

        controller.close();

        convex
          .mutation(api.ai.insight_storage.recordChatTurn, {
            threadId: typedThreadId,
            userMessage: message.trim(),
            assistantMessage: assistantText,
            pageContext: pageContext ?? undefined,
            displays:
              collectedDisplays.length > 0 ? collectedDisplays : undefined,
          })
          .catch((e) => {
            console.error("failed to persist chat turn", e);
          });
      } catch (e) {
        console.error("Claude API error:", e);
        try {
          send({
            type: "error",
            value: "Sorry — the AI request failed. Try again.",
          });
        } catch {
          /* ignore */
        }
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function humanizeTool(name: string): string {
  switch (name) {
    case "get_overview_stats":
      return "your training overview";
    case "get_top_exercises":
      return "top exercises by volume";
    case "get_exercise_history":
      return "exercise history";
    case "get_recent_sessions":
      return "recent sessions";
    case "get_prs":
      return "recent PRs";
    case "get_body_measurements":
      return "body measurements";
    case "get_muscle_group_breakdown":
      return "muscle-group breakdown";
    case "search_exercise":
      return "matching exercises";
    case "show_exercise_chart":
      return "the exercise chart";
    case "show_workout_plan":
      return "the workout plan";
    case "show_stat":
      return "the stat highlight";
    case "show_session_list":
      return "recent sessions";
    default:
      return name;
  }
}
