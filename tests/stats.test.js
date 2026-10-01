import { describe, it, expect } from "vitest";
import { predictQuantile, ratioInWindow, RATIO_FIRST_HOUR } from "../src/utils/stats";

const levels = [10, 50, 90];
const values = [1, 10, 100];

describe("predictQuantile", () => {
  it("clamps outside the quantile range", () => {
    expect(predictQuantile(0.5, values, levels)).toBe(10);
    expect(predictQuantile(1000, values, levels)).toBe(90);
  });

  it("interpolates in log space", () => {
    expect(predictQuantile(10, values, levels)).toBeCloseTo(50);
    expect(predictQuantile(Math.sqrt(10), values, levels)).toBeCloseTo(30);
  });

  it("returns 0 on bad input", () => {
    expect(predictQuantile(NaN, values, levels)).toBe(0);
    expect(predictQuantile(5, undefined, levels)).toBe(0);
    expect(predictQuantile(5, [1, 2], levels)).toBe(0);
  });
});

describe("ratioInWindow", () => {
  const ratio = Array.from({ length: 15 }, (_, i) => i); // 04..18 UTC

  it("keeps the hours inside both the ratio and the day window", () => {
    const { hours, ratio: r } = ratioInWindow(ratio, { first: 5, last: 25 });
    expect(hours[0]).toBe(5);
    expect(hours.at(-1)).toBe(RATIO_FIRST_HOUR + ratio.length - 1);
    expect(r[0]).toBe(1);
  });

  it("handles missing data", () => {
    expect(ratioInWindow(null, { first: 5, last: 10 })).toEqual({ hours: [], ratio: [] });
  });
});
