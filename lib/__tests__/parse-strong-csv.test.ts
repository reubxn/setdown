import { describe, it, expect } from "vitest";
import {
  parseStrongCsv,
  parseDuration,
  parseSetType,
  parseStrongDate,
} from "../parse-strong-csv";

const SAMPLE_CSV = `Date,Workout Name,Duration,Exercise Name,Set Order,Weight,Reps,Distance,Seconds,RPE
2023-09-27 2:07:56 p.m.,"legs",1h 38m,"Hip Adductor (Machine)",W,20.0,10.0,0,0.0,
2023-09-27 2:07:56 p.m.,"legs",1h 38m,"Hip Adductor (Machine)",1,36.0,15.0,0,0.0,
2023-09-28 5:22:12 p.m.,"chest n back",1h 2m,"Bench Press (Dumbbell)",D,18.0,12.0,0,0.0,
2023-09-28 5:22:12 p.m.,"chest n back",1h 2m,"Bench Press (Dumbbell)",F,16.0,8.0,0,0.0,
`;

describe("parseSetType", () => {
  it("maps set order codes", () => {
    expect(parseSetType("W")).toEqual({ setType: "warmup", setIndex: null });
    expect(parseSetType("1")).toEqual({ setType: "working", setIndex: 1 });
    expect(parseSetType("D")).toEqual({ setType: "dropset", setIndex: null });
    expect(parseSetType("F")).toEqual({ setType: "failure", setIndex: null });
  });
});

describe("parseDuration", () => {
  it("parses hours and minutes", () => {
    expect(parseDuration("1h 38m")).toBe(98);
    expect(parseDuration("45m")).toBe(45);
    expect(parseDuration("1h 2m")).toBe(62);
  });
});

describe("parseStrongDate", () => {
  it("parses Strong date format", () => {
    const d = parseStrongDate("2023-09-27 2:07:56 p.m.");
    expect(d).not.toBeNull();
    expect(d!.getFullYear()).toBe(2023);
    expect(d!.getMonth()).toBe(8);
    expect(d!.getHours()).toBe(14);
  });
});

describe("parseStrongCsv", () => {
  it("parses valid CSV", () => {
    const result = parseStrongCsv(SAMPLE_CSV, "test.csv");
    expect("dataset" in result).toBe(true);
    if ("dataset" in result) {
      expect(result.dataset.sessions.length).toBe(2);
      expect(result.dataset.exercises.length).toBe(2);
      const legs = result.dataset.sessions.find((s) => s.workoutName === "legs");
      expect(legs?.totalVolume).toBe(36 * 15);
    }
  });

  it("rejects missing columns", () => {
    const result = parseStrongCsv("foo,bar\n1,2", "bad.csv");
    expect("error" in result).toBe(true);
  });

  it("rejects empty CSV", () => {
    const result = parseStrongCsv(
      "Date,Workout Name,Duration,Exercise Name,Set Order,Weight,Reps,Distance,Seconds,RPE\n",
      "empty.csv"
    );
    expect("error" in result).toBe(true);
  });
});
