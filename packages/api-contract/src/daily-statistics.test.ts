import { describe, expect, it } from "vitest";

import { dailyStatisticsQuerySchema } from "./daily-statistics.js";

describe("dailyStatisticsQuerySchema", () => {
  it("defaults to the first page of the newest Days", () => {
    expect(dailyStatisticsQuerySchema.parse({})).toEqual({
      page: 1,
      pageSize: 50,
      sortBy: "date",
      sortDirection: "desc",
    });
  });

  it("rejects a sort column outside the allowlist", () => {
    expect(dailyStatisticsQuerySchema.safeParse({ sortBy: "hourlyPrice" }).success).toBe(false);
  });

  it("rejects an inverted date range", () => {
    const result = dailyStatisticsQuerySchema.safeParse({
      dateFrom: "2024-06-02",
      dateTo: "2024-06-01",
    });

    expect(result.success).toBe(false);
  });
});
