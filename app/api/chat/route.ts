import Anthropic from "@anthropic-ai/sdk";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import type { AIContext } from "@/lib/types";
import { CHAT_SYSTEM_PROMPT } from "@/lib/ai/insight-prompts";

const DAILY_LIMIT = 50;

export async function POST(request: Request) {
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
      { error: "Convex is not configured." },
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

  const usage = await convex.query(api.ai.insight_storage.chatUsageToday, {});
  if (usage.used >= DAILY_LIMIT) {
    return Response.json(
      { error: `Daily limit reached (${DAILY_LIMIT} messages).` },
      { status: 429 },
    );
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return Response.json(
      { error: "Content-Type must be application/json" },
      { status: 400 },
    );
  }

  const raw = await request.text();
  if (raw.length > 64_000) {
    return Response.json({ error: "Request body too large" }, { status: 413 });
  }

  let body: {
    message?: string;
    context?: AIContext;
    pageContext?: string;
  };
  try {
    body = JSON.parse(raw);
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { message, context, pageContext } = body;
  if (!message?.trim() || !context) {
    return Response.json(
      { error: "message and context are required" },
      { status: 400 },
    );
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "AI is not configured. Set ANTHROPIC_API_KEY on the server." },
      { status: 503 },
    );
  }

  const priorMessages = await convex.query(
    api.ai.insight_storage.listChatMessages,
    { limit: 20 },
  );
  const history: { role: "user" | "assistant"; content: string }[] =
    priorMessages.map((m) => ({ role: m.role, content: m.content }));

  const client = new Anthropic({ apiKey });

  const userTurnContent = `Training data summary:\n\`\`\`json\n${JSON.stringify(context, null, 2)}\n\`\`\`\n\nQuestion: ${message}`;

  try {
    const stream = await client.messages.stream({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: CHAT_SYSTEM_PROMPT,
      messages: [
        ...history.filter((m) => m.content.trim().length > 0).slice(-10),
        { role: "user", content: userTurnContent },
      ],
    });

    const encoder = new TextEncoder();
    let assistantText = "";

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              assistantText += event.delta.text;
              controller.enqueue(encoder.encode(event.delta.text));
            }
          }
          controller.close();
          convex
            .mutation(api.ai.insight_storage.recordChatTurn, {
              userMessage: message,
              assistantMessage: assistantText,
              pageContext: pageContext ?? undefined,
            })
            .catch((e) => {
              console.error("failed to persist chat turn", e);
            });
        } catch (e) {
          controller.error(e);
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  } catch (e) {
    console.error("Claude API error:", e);
    return Response.json(
      { error: "Failed to get AI response. Try again later." },
      { status: 500 },
    );
  }
}
