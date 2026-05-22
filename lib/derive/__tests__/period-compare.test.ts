import { describe, expect, it } from "vitest";
import { periodCompare } from "../period-compare";
import type { WorkoutDataset, WorkoutSession } from "@/lib/types";

function session(
  date: Date,
  volume: number,
  duration = 60
): WorkoutSession {
  return {
    id: date.toISOString(),
    date,
    workoutName: "test",
    durationMinutes: duration,
    sets: [
      {
        id: `${date.toISOString()}-set`,
        date,
        workoutName: "test",
        durationMinutes: duration,
        exerciseName: "bench",
        setOrder: "1",
        setType: "working",
        setIndex: 1,
        weight: 100,
        reps: 5,
        distance: 0,
        seconds: 0,
        rpe: null,
        volume,
      },
    ],
    totalVolume: volume,
    exerciseCount: 1,
  };
}

function dataset(sessions: WorkoutSession[], end: Date): WorkoutDataset {
  return {
    importedAt: new Date().toISOString(),
    fileName: "test.csv",
    sessions,
    exercises: ["bench"],
    dateRange: {
      start: sessions[0]?.date ?? end,
      end,
    },
  };
}

describe("periodCompare", () => {
  it("compares months", () => {
    const ref = new Date("2026-04-29");
    const ds = dataset(
      [
        session(new Date("2026-03-05"), 1000),
        session(new Date("2026-03-15"), 1000),
        session(new Date("2026-04-05"), 1500),
        session(new Date("2026-04-12"), 1500),
        session(new Date("2026-04-19"), 1500),
      ],
      ref
    );

    const c = periodCompare(ds, "month");
    expect(c.current.sessionCount).toBe(3);
    expect(c.previous.sessionCount).toBe(2);
    expect(c.current.totalVolume).toBe(4500);
    expect(c.previous.totalVolume).toBe(2000);
    expect(Math.round(c.delta.volumePercent)).toBe(125);
    expect(c.delta.sessions).toBe(1);
  });

  it("handles zero previous gracefully", () => {
    const ref = new Date("2026-04-29");
    const ds = dataset([session(new Date("2026-04-10"), 500)], ref);
    const c = periodCompare(ds, "month");
    expect(c.previous.sessionCount).toBe(0);
    expect(c.delta.sessionsPercent).toBe(100);
  });
});
