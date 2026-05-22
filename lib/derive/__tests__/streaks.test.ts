import { describe, expect, it } from "vitest";
import { computeStreaks } from "../streaks";
import type { WorkoutDataset, WorkoutSession } from "@/lib/types";

function session(date: Date, id = date.toISOString()): WorkoutSession {
  return {
    id,
    date,
    workoutName: "test",
    durationMinutes: 60,
    sets: [],
    totalVolume: 0,
    exerciseCount: 0,
  };
}

function dataset(dates: Date[], end?: Date): WorkoutDataset {
  return {
    importedAt: new Date().toISOString(),
    fileName: "test.csv",
    sessions: dates.map((d) => session(d)),
    exercises: [],
    dateRange: {
      start: dates[0] ?? new Date(),
      end: end ?? dates[dates.length - 1] ?? new Date(),
    },
  };
}

describe("computeStreaks", () => {
  it("returns zeros for empty dataset", () => {
    expect(computeStreaks(dataset([]))).toEqual({
      currentWeeks: 0,
      longestWeeks: 0,
      totalActiveWeeks: 0,
    });
  });

  it("counts consecutive weeks", () => {
    const dates = [
      new Date("2026-04-06"),
      new Date("2026-04-13"),
      new Date("2026-04-20"),
      new Date("2026-04-27"),
    ];
    const s = computeStreaks(dataset(dates, new Date("2026-04-29")));
    expect(s.currentWeeks).toBe(4);
    expect(s.longestWeeks).toBe(4);
    expect(s.totalActiveWeeks).toBe(4);
  });

  it("breaks current streak when latest week is stale", () => {
    const dates = [
      new Date("2026-03-02"),
      new Date("2026-03-09"),
      new Date("2026-03-16"),
    ];
    const s = computeStreaks(dataset(dates, new Date("2026-04-29")));
    expect(s.currentWeeks).toBe(0);
    expect(s.longestWeeks).toBe(3);
  });

  it("longest streak survives gaps", () => {
    const dates = [
      new Date("2026-01-05"),
      new Date("2026-01-12"),
      new Date("2026-01-19"),
      new Date("2026-02-09"),
      new Date("2026-02-16"),
    ];
    const s = computeStreaks(dataset(dates, new Date("2026-02-18")));
    expect(s.longestWeeks).toBe(3);
    expect(s.currentWeeks).toBe(2);
  });
});
