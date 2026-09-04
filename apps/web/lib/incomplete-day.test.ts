import { describe, expect, it } from "vitest";

import { describeIncompleteness, isIncompleteDay } from "./incomplete-day";

describe("isIncompleteDay", () => {
  it("holds for a Day the dataset covers in part", () => {
    expect(isIncompleteDay({ hoursWithData: 10, hoursInDay: 24 })).toBe(true);
  });

  it("does not hold for a Day the dataset covers in full", () => {
    expect(isIncompleteDay({ hoursWithData: 24, hoursInDay: 24 })).toBe(false);
  });

  it("treats a full spring-forward Day as complete at 23 hours", () => {
    expect(isIncompleteDay({ hoursWithData: 23, hoursInDay: 23 })).toBe(false);
  });

  it("holds for a fall-back Day the dataset does not fill", () => {
    expect(isIncompleteDay({ hoursWithData: 24, hoursInDay: 25 })).toBe(true);
  });
});

describe("describeIncompleteness", () => {
  it("names both counts, so the reader can see how much is missing", () => {
    expect(describeIncompleteness({ hoursWithData: 10, hoursInDay: 24 })).toBe(
      "Incomplete day: the dataset holds 10 of 24 hours, so these totals are not comparable to a full day's",
    );
  });

  it("names the Day's own length, not 24, for a fall-back Day", () => {
    expect(describeIncompleteness({ hoursWithData: 24, hoursInDay: 25 })).toContain("24 of 25");
  });

  it("says nothing about a Day the dataset covers in full", () => {
    expect(describeIncompleteness({ hoursWithData: 23, hoursInDay: 23 })).toBeNull();
  });
});
