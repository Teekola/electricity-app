import { describe, expect, it } from "vitest";

import {
  DAILY_STATISTICS_RANGES,
  dailyStatisticsQuerySchema,
  isNullableMeasure,
} from "./daily-statistics.js";

describe("dailyStatisticsQuerySchema", () => {
  it("defaults to the first page of the newest Days", () => {
    expect(dailyStatisticsQuerySchema.parse({})).toEqual({
      page: 1,
      size: 50,
      sort: "date",
      dir: "desc",
    });
  });

  it("rejects a sort column outside the allowlist", () => {
    expect(dailyStatisticsQuerySchema.safeParse({ sort: "hourlyPrice" }).success).toBe(false);
  });

  it("takes a bound for every measure", () => {
    expect(
      dailyStatisticsQuerySchema.parse({
        prodMin: "8000",
        prodMax: "30000",
        consMin: "100",
        consMax: "500",
        priceMin: "-50",
        priceMax: "90.5",
        streakMin: "1",
        streakMax: "24",
      }),
    ).toMatchObject({
      prodMin: 8000,
      prodMax: 30000,
      consMin: 100,
      consMax: 500,
      priceMin: -50,
      priceMax: 90.5,
      streakMin: 1,
      streakMax: 24,
    });
  });

  it.each(["", " ", "\t"])("reads a blank bound (%j) as no bound at all, not as zero", (blank) => {
    expect(dailyStatisticsQuerySchema.parse({ priceMin: blank })).not.toHaveProperty("priceMin", 0);
  });

  it("still takes a bound of exactly zero, which is a real bound on a price", () => {
    expect(dailyStatisticsQuerySchema.parse({ priceMax: "0" })).toMatchObject({ priceMax: 0 });
  });

  it("rejects a bound that is not a number", () => {
    expect(dailyStatisticsQuerySchema.safeParse({ priceMin: "cheap" }).success).toBe(false);
  });

  it("rejects an inverted date range", () => {
    const result = dailyStatisticsQuerySchema.safeParse({
      dateFrom: "2024-06-02",
      dateTo: "2024-06-01",
    });

    expect(result.success).toBe(false);
  });

  it.each(DAILY_STATISTICS_RANGES.filter(([min]) => min !== "dateFrom"))(
    "rejects %s greater than %s",
    (min, max) => {
      expect(dailyStatisticsQuerySchema.safeParse({ [min]: "9", [max]: "2" }).success).toBe(false);
    },
  );

  it.each(DAILY_STATISTICS_RANGES.filter(([min]) => min !== "dateFrom"))(
    "accepts %s equal to %s",
    (min, max) => {
      expect(dailyStatisticsQuerySchema.safeParse({ [min]: "5", [max]: "5" }).success).toBe(true);
    },
  );

  it("accepts a bound on its own", () => {
    expect(dailyStatisticsQuerySchema.safeParse({ streakMin: "3" }).success).toBe(true);
  });
});

describe("isNullableMeasure", () => {
  it.each(["prod", "cons", "price"] as const)("reports %s as missing on some Days", (measure) => {
    expect(isNullableMeasure(measure)).toBe(true);
  });

  it("reports a streak as always measured, since a Day without one scores zero", () => {
    expect(isNullableMeasure("streak")).toBe(false);
  });
});
