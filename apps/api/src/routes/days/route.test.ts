import type { FastifyInstance } from "fastify";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { dayDetailSchema, daysListSchema } from "@repo/api-contract";

import { buildApp } from "../../app.js";

describe("GET /days", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
  });

  afterAll(async () => {
    await app.close();
  });

  function get(query: Record<string, string> = {}) {
    return app.inject({ method: "GET", url: "/days", query });
  }

  it("serves the newest Days first, with no query at all", async () => {
    const response = await get();

    expect(response.statusCode).toBe(200);

    const body = daysListSchema.parse(response.json());

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
      size: "5",
      sort: "price",
      dir: "asc",
      dateFrom: "2024-01-01",
      dateTo: "2024-01-31",
    });

    expect(response.statusCode).toBe(200);

    const { dailyStatistics, pagination } = daysListSchema.parse(response.json());
    const prices = dailyStatistics.map(({ averagePriceCentsPerKwh }) => averagePriceCentsPerKwh);

    expect(pagination).toEqual({ page: 2, pageSize: 5, totalDays: 31, totalPages: 7 });
    expect(prices).toEqual([...prices].sort((a, b) => (a ?? 0) - (b ?? 0)));
    expect(dailyStatistics.every(({ date }) => date.startsWith("2024-01"))).toBe(true);
  });

  it("rejects a sort column outside the contract's allowlist", async () => {
    const response = await get({ sort: "id" });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ code: "BAD_REQUEST" });
  });

  it("rejects a date range that runs backwards", async () => {
    const response = await get({ dateFrom: "2024-02-01", dateTo: "2024-01-01" });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ code: "BAD_REQUEST" });
  });

  it("rejects a page size no client should ask for", async () => {
    const response = await get({ size: "5000" });

    expect(response.statusCode).toBe(400);
  });

  it("takes a measure's bounds from the query string", async () => {
    const response = await get({ streakMin: "1", priceMax: "0", size: "200" });

    expect(response.statusCode).toBe(200);

    const { dailyStatistics, pagination } = daysListSchema.parse(response.json());

    expect(pagination.totalDays).toBeGreaterThan(0);
    expect(pagination.totalDays).toBeLessThan(144);
    expect(
      dailyStatistics.every(
        ({ longestNegativePriceStreakHours, averagePriceCentsPerKwh }) =>
          longestNegativePriceStreakHours >= 1 && (averagePriceCentsPerKwh ?? 1) <= 0,
      ),
    ).toBe(true);
  });

  it("rejects a measure's range that runs backwards", async () => {
    const response = await get({ priceMin: "9", priceMax: "2" });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ code: "BAD_REQUEST" });
  });

  it("rejects a bound that is not a number", async () => {
    const response = await get({ consMin: "plenty" });

    expect(response.statusCode).toBe(400);
  });
});

describe("GET /days/:date", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
  });

  afterAll(async () => {
    await app.close();
  });

  function get(date: string) {
    return app.inject({ method: "GET", url: `/days/${date}` });
  }

  it("serves one Day in full", async () => {
    const response = await get("2024-06-01");

    expect(response.statusCode).toBe(200);

    const { dailyStatistics, dataPoints, peakConsumptionRatioHours, cheapestHours } =
      dayDetailSchema.parse(response.json());

    expect(dailyStatistics).toMatchObject({ date: "2024-06-01", hoursWithData: 24 });
    expect(dataPoints).toHaveLength(24);
    expect(peakConsumptionRatioHours).toMatchObject([{ hour: "20:00" }]);
    expect(cheapestHours.map(({ hour }) => hour)).toEqual(["00:00", "04:00", "05:00"]);
  });

  it("answers 404 for a Day the dataset does not cover", async () => {
    const response = await get("2019-01-01");

    expect(response.statusCode).toBe(404);
    expect(response.json()).toMatchObject({ code: "NOT_FOUND" });
  });

  it("rejects a segment that is not a date at all", async () => {
    const response = await get("yesterday");

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ code: "BAD_REQUEST" });
  });
});
