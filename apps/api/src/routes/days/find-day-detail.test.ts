import type { FastifyInstance } from "fastify";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { DataPoint, DayDetail, IsoDate } from "@repo/api-contract";

import { buildApp } from "../../app.js";

import { cheapestHours, findDayDetail, peakConsumptionRatioHours } from "./find-day-detail.js";
import { findDaysWithStatistics } from "./find-days-with-statistics.js";

/** The Days named below are fixture Days, each chosen to exercise one domain case. */
describe("findDayDetail", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
  });

  afterAll(async () => {
    await app.close();
  });

  function find(date: IsoDate): Promise<DayDetail | null> {
    return findDayDetail(app.prisma, date);
  }

  /** Fails loudly rather than letting every assertion below repeat the null check. */
  async function detailOf(date: IsoDate): Promise<DayDetail> {
    const dayDetail = await find(date);

    if (dayDetail === null) throw new Error(`Expected the dataset to cover ${date}`);

    return dayDetail;
  }

  it("finds no Day before the dataset begins", async () => {
    expect(await find("2019-01-01")).toBeNull();
  });

  it("finds no Day after the dataset ends", async () => {
    expect(await find("2025-06-01")).toBeNull();
  });

  it("holds one Data Point per hour of the Day, in chronological order", async () => {
    const { dataPoints } = await detailOf("2024-06-01");

    expect(dataPoints).toHaveLength(24);
    expect(dataPoints.map(({ hour }) => hour)).toEqual(
      [...dataPoints.map(({ hour }) => hour)].sort(),
    );
    expect(dataPoints[0]?.hour).toBe("00:00");
    expect(dataPoints.at(-1)?.hour).toBe("23:00");
  });

  it("measures a Data Point's consumption in MWh, as the Daily Statistics do", async () => {
    const { dataPoints } = await detailOf("2024-06-01");

    expect(dataPoints[0]).toMatchObject({ hour: "00:00", priceCentsPerKwh: 0.956 });
    expect(dataPoints[0]?.productionMwh).toBeCloseTo(25039.13, 2);
    expect(dataPoints[0]?.consumptionMwh).toBeCloseTo(3298.06, 2);
  });

  it("carries the very Daily Statistics the list serves for that Day", async () => {
    const { dailyStatistics } = await detailOf("2024-06-01");
    const { dailyStatistics: listed } = await findDaysWithStatistics(app.prisma, {
      page: 1,
      size: 1,
      sort: "date",
      dir: "desc",
      dateFrom: "2024-06-01",
      dateTo: "2024-06-01",
    });

    expect(dailyStatistics).toEqual(listed[0]);
  });

  it("holds only the hours the dataset covers on a spring-forward Day", async () => {
    const { dataPoints } = await detailOf("2024-03-31");

    expect(dataPoints).toHaveLength(23);
    expect(dataPoints.map(({ hour }) => hour)).not.toContain("03:00");
  });

  describe("the Peak Consumption Ratio Hour", () => {
    it("names the hour whose consumption is the largest fraction of its own production", async () => {
      const { peakConsumptionRatioHours } = await detailOf("2024-06-01");
      const [peak] = peakConsumptionRatioHours;

      expect(peakConsumptionRatioHours).toHaveLength(1);
      expect(peak).toMatchObject({ hour: "20:00" });
      expect(peak?.consumptionToProductionRatio).toBeCloseTo(0.159829, 6);
      expect(peak?.productionMwh).toBeCloseTo(26025.12, 2);
      expect(peak?.consumptionMwh).toBeCloseTo(4159.568, 3);
    });

    it("ranks by ratio, not by the difference, which names 22:00 on that same Day", async () => {
      const { dataPoints, peakConsumptionRatioHours } = await detailOf("2024-06-01");

      const byDifference = [...dataPoints].sort(
        (a, b) =>
          (b.consumptionMwh ?? 0) -
          (b.productionMwh ?? 0) -
          ((a.consumptionMwh ?? 0) - (a.productionMwh ?? 0)),
      );

      expect(byDifference[0]?.hour).toBe("22:00");
      expect(peakConsumptionRatioHours[0]?.hour).toBe("20:00");
    });

    it("is absent on a Day that never measured consumption", async () => {
      const { dailyStatistics, peakConsumptionRatioHours } = await detailOf("2023-01-01");

      expect(dailyStatistics.totalConsumptionMwh).toBeNull();
      expect(peakConsumptionRatioHours).toEqual([]);
    });
  });

  describe("the Cheapest Hours", () => {
    it("lists three hours, cheapest first", async () => {
      const { cheapestHours } = await detailOf("2024-06-01");

      expect(cheapestHours).toEqual([
        { hour: "00:00", priceCentsPerKwh: 0.956 },
        { hour: "04:00", priceCentsPerKwh: 1.629 },
        { hour: "05:00", priceCentsPerKwh: 1.674 },
      ]);
    });

    it("reports every hour tied with the third cheapest, rather than three of them", async () => {
      const { cheapestHours } = await detailOf("2023-11-24");

      // Nine hours of that Day sit on the price floor, so a fixed three would cut a real tie.
      expect(cheapestHours).toHaveLength(9);
      expect(cheapestHours.every(({ priceCentsPerKwh }) => priceCentsPerKwh === -50)).toBe(true);
    });

    it("still reports three on a Day whose third cheapest hour ties with nothing", async () => {
      const { cheapestHours } = await detailOf("2024-06-01");

      expect(cheapestHours).toHaveLength(3);
    });

    it("skips the hour a spring-forward Day does not have", async () => {
      const { cheapestHours } = await detailOf("2024-03-31");

      expect(cheapestHours.map(({ hour }) => hour)).toEqual(["15:00", "16:00", "14:00"]);
    });
  });

  describe("2020-12-31, the dataset's first and emptiest Day", () => {
    it("holds only the two hours the dataset begins with", async () => {
      const { dataPoints } = await detailOf("2020-12-31");

      expect(dataPoints.map(({ hour }) => hour)).toEqual(["22:00", "23:00"]);
    });

    it("reports no Cheapest Hours, because none of its Data Points carry a price", async () => {
      const { dailyStatistics, cheapestHours } = await detailOf("2020-12-31");

      expect(dailyStatistics.averagePriceCentsPerKwh).toBeNull();
      expect(cheapestHours).toEqual([]);
    });

    it("reports no Peak Consumption Ratio Hour either", async () => {
      expect((await detailOf("2020-12-31")).peakConsumptionRatioHours).toEqual([]);
    });
  });
});

/**
 * Cases the fixture cannot show. Nothing in the domain forbids two hours measuring identically,
 * so the tie has to resolve the same way every time whether or not this dataset holds one.
 */
describe("ties between hours", () => {
  function dataPoint(
    hour: string,
    productionMwh: number | null,
    consumptionMwh: number | null,
    priceCentsPerKwh: number | null,
  ): DataPoint {
    return { hour, productionMwh, consumptionMwh, priceCentsPerKwh };
  }

  it("reports both hours when two measure the same consumption against production", () => {
    const peaks = peakConsumptionRatioHours([
      dataPoint("00:00", 100, 10, null),
      dataPoint("01:00", 100, 50, null),
      dataPoint("02:00", 200, 100, null),
    ]);

    expect(peaks.map(({ hour }) => hour)).toEqual(["01:00", "02:00"]);
    expect(
      peaks.every(({ consumptionToProductionRatio }) => consumptionToProductionRatio === 0.5),
    ).toBe(true);
  });

  it("reports both when the same fraction is written with different magnitudes", () => {
    const peaks = peakConsumptionRatioHours([
      dataPoint("05:00", 30_000, 6000, null),
      dataPoint("06:00", 10_000, 2000, null),
    ]);

    expect(peaks.map(({ hour }) => hour)).toEqual(["05:00", "06:00"]);
  });

  it("reports every hour of a Day whose price never changes", () => {
    const flat = ["00:00", "01:00", "02:00", "03:00", "04:00"].map((hour) =>
      dataPoint(hour, 100, null, 4.2),
    );

    expect(cheapestHours(flat).map(({ hour }) => hour)).toEqual([
      "00:00",
      "01:00",
      "02:00",
      "03:00",
      "04:00",
    ]);
  });
});
