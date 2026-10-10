import { describe, expect, it } from "vitest";
import { logPosition, rangeBar } from "../src/utils/rangeBar.js";

const levels = [1, 5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 99];
const quantiles = [0, 1, 2, 4, 6, 8, 10, 14, 20, 30, 50, 80, 100];

describe("logPosition", () => {
  it("maps 0 to 0 and max to 100", () => {
    expect(logPosition(0, 100)).toBe(0);
    expect(logPosition(100, 100)).toBe(100);
  });
  it("is log-scaled and clamped", () => {
    expect(logPosition(9, 99)).toBeCloseTo(50, 5);
    expect(logPosition(500, 100)).toBe(100);
    expect(logPosition(-3, 100)).toBe(0);
  });
});

describe("rangeBar", () => {
  const base = {
    quantiles,
    levels,
    predicted: 20,
    predictedQuantile: 70,
    counted: 5,
    countedQuantile: 25,
  };
  it("uses percentile levels on the quantile axis", () => {
    const bar = rangeBar({ ...base, mode: "quantile" });
    expect(bar).toMatchObject({
      outer: [5, 95],
      inner: [20, 80],
      median: 50,
      predicted: 70,
      counted: 25,
    });
  });
  it("places values on a log axis in number mode", () => {
    const bar = rangeBar({ ...base, mode: "number" });
    expect(bar.outer[0]).toBeLessThan(bar.outer[1]);
    expect(bar.predicted).toBeGreaterThan(bar.counted);
    expect(bar.median).toBeCloseTo(logPosition(10, 100), 5);
  });
  it("extends the axis when a value exceeds the 99th percentile", () => {
    const bar = rangeBar({ ...base, mode: "number", predicted: 1000 });
    expect(bar.predicted).toBe(100);
    expect(bar.outer[1]).toBeLessThan(100);
  });
  it("returns null without historical quantiles", () => {
    expect(rangeBar({ ...base, mode: "number", quantiles: null })).toBeNull();
  });
});
