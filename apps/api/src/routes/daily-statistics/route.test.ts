import type { FastifyInstance } from "fastify";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { dailyStatisticsListSchema } from "@repo/api-contract";

import { buildApp } from "../../app.js";

describe("GET /daily-statistics", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
  });

  afterAll(async () => {
    await app.close();
  });

  function get(query: Record<string, string> = {}) {
    return app.inject({ method: "GET", url: "/daily-statistics", query });
  }

  it("serves the newest Days first, with no query at all", async () => {
    const response = await get();

    expect(response.statusCode).toBe(200);

    const body = dailyStatisticsListSchema.parse(response.json());

    expect(body.pagination).toEqual({
      page: 1,
      pageSize: 50,
      totalDays: 1371,
      totalPages: 28,
    });
    expect(body.dailyStatistics).toHaveLength(50);

    const [newest] = body.dailyStatistics;

    expect(newest).toMatchObject({
      date: "2024-10-01",
      totalConsumptionMwh: null,
      longestNegativePriceStreakHours: 0,
      hoursWithData: 21,
      hoursInDay: 24,
    });
    expect(newest?.totalProductionMwh).toBeCloseTo(719282.09, 2);
    expect(newest?.averagePriceCentsPerKwh).toBeCloseTo(5.83019, 5);
  });

  it("takes pagination, ordering and a date range from the query string", async () => {
    const response = await get({
      page: "2",
      pageSize: "5",
      sortBy: "averagePriceCentsPerKwh",
      sortDirection: "asc",
      dateFrom: "2024-01-01",
      dateTo: "2024-01-31",
    });

    expect(response.statusCode).toBe(200);

    const { dailyStatistics, pagination } = dailyStatisticsListSchema.parse(response.json());
    const prices = dailyStatistics.map(({ averagePriceCentsPerKwh }) => averagePriceCentsPerKwh);

    expect(pagination).toEqual({ page: 2, pageSize: 5, totalDays: 31, totalPages: 7 });
    expect(prices).toEqual([...prices].sort((a, b) => (a ?? 0) - (b ?? 0)));
    expect(dailyStatistics.every(({ date }) => date.startsWith("2024-01"))).toBe(true);
  });

  it("rejects a sort column outside the contract's allowlist", async () => {
    const response = await get({ sortBy: "id" });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ code: "BAD_REQUEST" });
  });

  it("rejects a date range that runs backwards", async () => {
    const response = await get({ dateFrom: "2024-02-01", dateTo: "2024-01-01" });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ code: "BAD_REQUEST" });
  });

  it("rejects a page size no client should ask for", async () => {
    const response = await get({ pageSize: "5000" });

    expect(response.statusCode).toBe(400);
  });
});
