import Anthropic from "@anthropic-ai/sdk";
import type { AIContext } from "@/lib/types";

const rateLimit = new Map<string, { count: number; resetAt: number }>();
const LIMIT = 10;
const WINDOW_MS = 60_000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimit.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimit.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (entry.count >= LIMIT) return false;
  entry.count++;
  return true;
}

const SYSTEM_PROMPT = `You are a concise strength-training analyst. The user exported data from the Strong app.
Use only the provided JSON summary. Be specific with numbers and dates.
Prefer short paragraphs and bullet points. Flag limitations (e.g. missing RPE).
Do not invent workouts or weights not in the context.`;

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  if (!checkRateLimit(ip)) {
    return Response.json(
      { error: "Rate limit exceeded. Try again in a minute." },
      { status: 429 }
    );
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return Response.json({ error: "Content-Type must be application/json" }, { status: 400 });
  }

  const raw = await request.text();
  if (raw.length > 32_768) {
    return Response.json({ error: "Request body too large" }, { status: 413 });
  }

  let body: { message?: string; context?: AIContext };
  try {
    body = JSON.parse(raw);
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { message, context } = body;
  if (!message?.trim() || !context) {
    return Response.json({ error: "message and context are required" }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "AI is not configured. Set ANTHROPIC_API_KEY on the server." },
      { status: 503 }
    );
  }

  const client = new Anthropic({ apiKey });

  try {
    const stream = await client.messages.stream({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Training data summary:\n\`\`\`json\n${JSON.stringify(context, null, 2)}\n\`\`\`\n\nQuestion: ${message}`,
        },
      ],
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              controller.enqueue(encoder.encode(event.delta.text));
            }
          }
          controller.close();
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
      { status: 500 }
    );
  }
}
