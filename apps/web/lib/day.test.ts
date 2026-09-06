import { describe, expect, it } from "vitest";

import { fromIsoDate, toIsoDate } from "./day";

describe("toIsoDate", () => {
  it("runs in a zone ahead of UTC, where a converted instant names the Day before", () => {
    expect(new Date(2023, 7, 1).getTimezoneOffset()).toBeLessThan(0);
    expect(new Date(2023, 7, 1).toISOString().slice(0, 10)).toBe("2023-07-31");
  });

  it("names the Day the calendar shows", () => {
    expect(toIsoDate(new Date(2023, 7, 1))).toBe("2023-08-01");
  });

  it("zero-pads a single-digit month and Day", () => {
    expect(toIsoDate(new Date(2024, 0, 5))).toBe("2024-01-05");
  });

  it("names the Day an instant late in it belongs to", () => {
    expect(toIsoDate(new Date(2024, 2, 31, 23, 59))).toBe("2024-03-31");
  });
});

describe("fromIsoDate", () => {
  it("lands on the Day itself, not the one before it", () => {
    const date = fromIsoDate("2023-08-01");

    expect([date.getFullYear(), date.getMonth(), date.getDate()]).toEqual([2023, 7, 1]);
  });

  it("is the inverse of toIsoDate, including on a spring-forward Day", () => {
    expect(toIsoDate(fromIsoDate("2024-03-31"))).toBe("2024-03-31");
    expect(toIsoDate(fromIsoDate("2021-01-01"))).toBe("2021-01-01");
  });
});
