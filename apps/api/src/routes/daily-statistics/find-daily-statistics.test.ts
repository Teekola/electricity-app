import type { FastifyInstance } from "fastify";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type {
  DailyStatistics,
  DailyStatisticsList,
  DailyStatisticsQuery,
  IsoDate,
} from "@repo/api-contract";

import { buildApp } from "../../app.js";

import { findDailyStatistics } from "./find-daily-statistics.js";

function descending(a: number | string, b: number | string): number {
  if (a === b) return 0;

  return a < b ? 1 : -1;
}

/** Orders the values it was given, so a page that only happens to arrive sorted still fails. */
function expectOrderedDescending(values: readonly (number | string)[]): void {
  expect(values.length).toBeGreaterThan(1);
  expect(values).toEqual([...values].sort(descending));
}

/** The Days named below are fixture Days, each chosen to exercise one domain case. */
describe("findDailyStatistics", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
  });

  afterAll(async () => {
    await app.close();
  });

  function find(query: Partial<DailyStatisticsQuery> = {}): Promise<DailyStatisticsList> {
    return findDailyStatistics(app.prisma, {
      page: 1,
      pageSize: 50,
      sortBy: "date",
      sortDirection: "desc",
      ...query,
    });
  }

  /** Reads one Day by filtering the range down to it, so no test depends on a page offset. */
  async function findDay(date: IsoDate): Promise<DailyStatistics> {
    const { dailyStatistics } = await find({ dateFrom: date, dateTo: date });
    const [day] = dailyStatistics;

    if (!day) throw new Error(`No Daily Statistics for ${date}`);

    return day;
  }

  async function twoNewestDates(): Promise<readonly [IsoDate, IsoDate]> {
    const { dailyStatistics } = await find({ pageSize: 2 });
    const [newest, previous] = dailyStatistics;

    if (!newest || !previous) throw new Error("The dataset holds fewer than two Days");

    return [newest.date, previous.date];
  }

  describe("clock changes", () => {
    it.each(["2021-03-28", "2022-03-27", "2023-03-26", "2024-03-31"])(
      "reports %s, a spring-forward Day, as 23 hours long and complete",
      async (date) => {
        const day = await findDay(date);

        expect(day.hoursInDay).toBe(23);
        expect(day.hoursWithData).toBe(23);
      },
    );

    it("reports a fall-back Day as 25 hours long, which the dataset does not fill", async () => {
      const day = await findDay("2023-10-29");

      expect(day.hoursInDay).toBe(25);
      expect(day.hoursWithData).toBe(24);
    });

    it("distinguishes a 23-hour Day with a missing Data Point from a spring-forward Day", async () => {
      const day = await findDay("2024-06-03");

      expect(day.hoursInDay).toBe(24);
      expect(day.hoursWithData).toBe(23);
    });
  });

  describe("incomplete Days", () => {
    it.each([
      { date: "2020-12-31", hoursWithData: 2 },
      { date: "2024-04-29", hoursWithData: 13 },
      { date: "2024-04-30", hoursWithData: 19 },
      { date: "2024-05-13", hoursWithData: 10 },
      { date: "2024-05-14", hoursWithData: 19 },
      { date: "2024-10-01", hoursWithData: 21 },
    ])("reports $date as holding $hoursWithData of 24 hours", async ({ date, hoursWithData }) => {
      const day = await findDay(date);

      expect(day).toMatchObject({ hoursWithData, hoursInDay: 24 });
    });

    it("averages the price over the hours present, not over the hours in the Day", async () => {
      const day = await findDay("2024-05-13");

      expect(day.hoursWithData).toBe(10);
      expect(day.averagePriceCentsPerKwh).toBeCloseTo(13.6881, 4);
    });
  });

  describe("missing measurements", () => {
    it("reports no average price for a Day whose every price is NULL", async () => {
      const day = await findDay("2020-12-31");

      expect(day.averagePriceCentsPerKwh).toBeNull();
    });

    it("reports no consumption before the first Day that measures it", async () => {
      const day = await findDay("2023-07-31");

      expect(day.totalConsumptionMwh).toBeNull();
      expect(day.totalProductionMwh).not.toBeNull();
    });
  });

  describe("units", () => {
    it("converts consumption from kWh to MWh and leaves production in MWh", async () => {
      const day = await findDay("2024-05-13");

      expect(day.totalProductionMwh).toBeCloseTo(244858.38, 2);
      expect(day.totalConsumptionMwh).toBeCloseTo(46586.807351, 6);
    });
  });

  describe("longest Negative Price Streak", () => {
    it("is 0 for a Day with no negative price", async () => {
      const day = await findDay("2023-07-31");

      expect(day.longestNegativePriceStreakHours).toBe(0);
    });

    it("spans the whole Day when every hour is negative", async () => {
      const day = await findDay("2024-08-25");

      expect(day.longestNegativePriceStreakHours).toBe(day.hoursInDay);
    });

    it("does not join a run that continues past midnight into the next Day", async () => {
      // 2024-08-24 ends negative and every hour of 2024-08-25 is negative, so a run joined
      // across midnight would outlast either Day. Measured per Day, neither streak does.
      const [previous, next] = await Promise.all([findDay("2024-08-24"), findDay("2024-08-25")]);

      expect(previous.longestNegativePriceStreakHours).toBe(19);
      expect(next.longestNegativePriceStreakHours).toBe(next.hoursInDay);
    });

    it("counts an isolated negative hour as a streak of one", async () => {
      // 2024-05-14 dips below zero at 17:00 and again at 23:00, with positive hours between.
      const day = await findDay("2024-05-14");

      expect(day.longestNegativePriceStreakHours).toBe(1);
    });
  });

  describe("pagination", () => {
    it("does not repeat or skip Days between consecutive pages", async () => {
      const [first, second] = await Promise.all([
        find({ page: 1, pageSize: 3 }),
        find({ page: 2, pageSize: 3 }),
      ]);
      const dates = [...first.dailyStatistics, ...second.dailyStatistics].map(({ date }) => date);

      expect(dates).toHaveLength(6);
      expect(new Set(dates).size).toBe(6);
      expectOrderedDescending(dates);
    });

    it("reports the page, its size and the number of pages the filter fills", async () => {
      const { pagination } = await find({ page: 2, pageSize: 7 });

      expect(pagination.page).toBe(2);
      expect(pagination.pageSize).toBe(7);
      expect(pagination.totalDays).toBeGreaterThan(0);
      expect(pagination.totalPages).toBe(Math.ceil(pagination.totalDays / pagination.pageSize));
    });

    it("returns no Days past the last page", async () => {
      const { pagination } = await find({ pageSize: 1 });
      const { dailyStatistics } = await find({ page: pagination.totalPages + 1, pageSize: 1 });

      expect(dailyStatistics).toEqual([]);
    });
  });

  describe("ordering", () => {
    it("orders newest Day first when the query asks for nothing else", async () => {
      const { dailyStatistics } = await find({ pageSize: 10 });

      expectOrderedDescending(dailyStatistics.map(({ date }) => date));
    });

    it("ranks the whole dataset by a measure, not just the page it returns", async () => {
      const query = {
        sortBy: "longestNegativePriceStreakHours",
        sortDirection: "desc",
        pageSize: 5,
      } as const;
      const [first, second] = await Promise.all([
        find({ ...query, page: 1 }),
        find({ ...query, page: 2 }),
      ]);

      expectOrderedDescending(
        [...first.dailyStatistics, ...second.dailyStatistics].map(
          ({ longestNegativePriceStreakHours }) => longestNegativePriceStreakHours,
        ),
      );
    });

    it.each(["asc", "desc"] as const)(
      "puts Days without a measurement last, sorting %s",
      async (sortDirection) => {
        const { dailyStatistics } = await find({ sortBy: "totalConsumptionMwh", sortDirection });
        const measured = dailyStatistics.map(
          ({ totalConsumptionMwh }) => totalConsumptionMwh !== null,
        );

        expect(measured[0]).toBe(true);
        // Once a Day without a measurement appears, every Day after it lacks one too.
        expect(measured).toEqual([...measured].sort((a, b) => Number(b) - Number(a)));
      },
    );
  });

  describe("date filtering", () => {
    it("narrows the Days to the requested range, and the page count with them", async () => {
      const [newest, previous] = await twoNewestDates();
      const { dailyStatistics, pagination } = await find({ dateFrom: previous, dateTo: newest });

      expect(pagination.totalDays).toBe(2);
      expect(dailyStatistics.map(({ date }) => date)).toEqual([newest, previous]);
    });

    it("treats dateFrom and dateTo as inclusive", async () => {
      const [newest, previous] = await twoNewestDates();
      const [first, second] = await Promise.all([
        find({ dateFrom: newest, dateTo: newest }),
        find({ dateFrom: previous, dateTo: previous }),
      ]);

      expect(first.dailyStatistics.map(({ date }) => date)).toEqual([newest]);
      expect(second.dailyStatistics.map(({ date }) => date)).toEqual([previous]);
    });

    it("returns nothing for a range the dataset does not cover", async () => {
      const { dailyStatistics, pagination } = await find({
        dateFrom: "2030-01-01",
        dateTo: "2030-01-31",
      });

      expect(dailyStatistics).toEqual([]);
      expect(pagination).toMatchObject({ totalDays: 0, totalPages: 0 });
    });
  });
});
