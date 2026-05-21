import { RateLimiter, HOUR } from "@convex-dev/rate-limiter";
import { components } from "./_generated/api";

export const rateLimiter = new RateLimiter(components.rateLimiter, {
  uploadDataset: { kind: "token bucket", rate: 10, period: HOUR, capacity: 10 },
  saveBodyMeasurement: {
    kind: "token bucket",
    rate: 60,
    period: HOUR,
    capacity: 60,
  },
  deleteAccount: {
    kind: "fixed window",
    rate: 3,
    period: HOUR * 24,
    capacity: 3,
  },
  wipeData: { kind: "fixed window", rate: 5, period: HOUR * 24, capacity: 5 },
  generateInsights: {
    kind: "token bucket",
    rate: 20,
    period: HOUR,
    capacity: 20,
  },
});
