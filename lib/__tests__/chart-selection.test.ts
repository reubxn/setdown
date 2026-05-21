import { describe, expect, it } from "vitest";
import {
  formatSelectionPercent,
  normalizeRange,
  selectionFromIndices,
} from "../chart-selection";

const points = [
  { id: "a", label: "Jan 1", value: 100 },
  { id: "b", label: "Jan 8", value: 150 },
  { id: "c", label: "Jan 15", value: 120 },
];

describe("chart-selection", () => {
  it("normalizes inverted ranges", () => {
    expect(normalizeRange(2, 0)).toEqual({ startIndex: 0, endIndex: 2 });
  });

  it("computes increase from start to end of selection", () => {
    const delta = selectionFromIndices(points, 0, 1);
    expect(delta).toMatchObject({
      startValue: 100,
      endValue: 150,
      absoluteChange: 50,
      percentChange: 50,
      direction: "up",
    });
  });

  it("computes decrease when end is lower", () => {
    const delta = selectionFromIndices(points, 1, 2);
    expect(delta?.direction).toBe("down");
    expect(delta?.absoluteChange).toBe(-30);
  });

  it("formats percent with sign", () => {
    expect(formatSelectionPercent(4.2)).toBe("+4.2%");
    expect(formatSelectionPercent(12.4)).toBe("+12%");
    expect(formatSelectionPercent(-8)).toBe("-8.0%");
  });
});
