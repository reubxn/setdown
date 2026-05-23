import { RateLimiter, HOUR } from "@convex-dev/rate-limiter";
import { components } from "./_generated/api";

export const rateLimiter = new RateLimiter(components.rateLimiter, {
  uploadDataset: { kind: "token bucket", rate: 10, period: HOUR, capacity: 10 },
  deleteAccount: {
    kind: "fixed window",
    rate: 3,
    period: HOUR * 24,
    capacity: 3,
  },
  wipeData: { kind: "fixed window", rate: 5, period: HOUR * 24, capacity: 5 },
  // Gates an Anthropic API request via /api/chat. Consumed by reserveChatTurn
  // before each LLM call so a stolen token can't burn credits faster than this.
  chatRequest: { kind: "token bucket", rate: 30, period: HOUR, capacity: 60 },
  // Storage for the persisted assistant turn. Independent of chatRequest so a
  // direct caller bypassing the route still gets throttled.
  chatTurn: { kind: "token bucket", rate: 60, period: HOUR, capacity: 60 },
  createThread: { kind: "token bucket", rate: 30, period: HOUR, capacity: 30 },
  renameThread: { kind: "token bucket", rate: 60, period: HOUR, capacity: 60 },
  deleteThread: { kind: "token bucket", rate: 30, period: HOUR, capacity: 30 },
});
