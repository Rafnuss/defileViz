import { describe, it, expect } from "vitest";
import {
  dayOfYear,
  dayWindow,
  nightMaskByDoy,
  localUtcOffset,
  localDateString,
  addDays,
} from "../src/utils/daylight";

describe("dayOfYear", () => {
  it("counts from 1 in UTC", () => {
    expect(dayOfYear("2026-01-01")).toBe(1);
    expect(dayOfYear("2026-10-01")).toBe(274);
    expect(dayOfYear("2024-12-31")).toBe(366);
  });
});

describe("night mask / day window", () => {
  it("has a contiguous day window that is longer in summer than in autumn", () => {
    for (const doy of [172, 244, 305]) {
      const mask = nightMaskByDoy(doy);
      const { first, last, nHours } = dayWindow(doy);
      expect(nHours).toBe(last - first + 1);
      expect(mask.slice(first, last + 1).every((m) => !m)).toBe(true);
    }
    expect(dayWindow(172).nHours).toBeGreaterThan(dayWindow(305).nHours);
  });

  it("accepts dates and day numbers alike", () => {
    expect(dayWindow("2026-10-01")).toEqual(dayWindow(274));
  });
});

describe("Paris time", () => {
  it("knows summer and winter time", () => {
    expect(localUtcOffset("2026-07-01")).toBe(2);
    expect(localUtcOffset("2026-12-01")).toBe(1);
  });

  it("gives the Paris calendar day, not the UTC one", () => {
    expect(localDateString(new Date("2026-09-30T23:30:00Z"))).toBe("2026-10-01");
    expect(localDateString(new Date("2026-10-01T12:00:00Z"))).toBe("2026-10-01");
  });

  it("adds days across month ends and DST changes", () => {
    expect(addDays("2026-09-30", 1)).toBe("2026-10-01");
    expect(addDays("2026-10-25", 1)).toBe("2026-10-26");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });
});
