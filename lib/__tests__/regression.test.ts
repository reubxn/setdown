import { describe, expect, it } from "vitest";
import {
  formatSlopePerMonth,
  linearFit,
  predictAt,
} from "../regression";

describe("regression", () => {
  it("returns null for fewer than two points", () => {
    expect(linearFit([])).toBeNull();
    expect(linearFit([{ date: "2026-01-01", value: 100 }])).toBeNull();
  });

  it("fits a clean line exactly (slope per day, R²=1)", () => {
    const fit = linearFit([
      { date: "2026-01-01", value: 100 },
      { date: "2026-01-11", value: 110 },
      { date: "2026-01-21", value: 120 },
    ]);
    expect(fit).not.toBeNull();
    expect(fit!.slopePerDay).toBeCloseTo(1, 10);
    expect(fit!.r2).toBeCloseTo(1, 10);
    expect(predictAt(fit!, "2026-02-01")).toBeCloseTo(131, 6);
  });

  it("converts slope to per-month using ~30.44 days", () => {
    const fit = linearFit([
      { date: "2026-01-01", value: 0 },
      { date: "2026-02-01", value: 31 },
    ]);
    expect(fit!.slopePerMonth).toBeCloseTo(30.4375, 6);
  });

  it("returns null when points share the same date", () => {
    expect(
      linearFit([
        { date: "2026-01-01", value: 100 },
        { date: "2026-01-01", value: 110 },
      ])
    ).toBeNull();
  });

  it("formats slope per month with sign", () => {
    const up = linearFit([
      { date: "2026-01-01", value: 100 },
      { date: "2026-02-01", value: 102 },
    ])!;
    expect(formatSlopePerMonth(up, "kg")).toMatch(/^\+2\.0 kg\/month$/);

    const down = linearFit([
      { date: "2026-01-01", value: 100 },
      { date: "2026-02-01", value: 95 },
    ])!;
    expect(formatSlopePerMonth(down, "kg")).toMatch(/kg\/month$/);
    expect(formatSlopePerMonth(down, "kg")!.startsWith("−")).toBe(true);
  });

  it("suppresses near-zero slope output", () => {
    const flat = linearFit([
      { date: "2026-01-01", value: 100 },
      { date: "2026-02-01", value: 100.01 },
    ])!;
    expect(formatSlopePerMonth(flat, "kg")).toBeNull();
  });
});
