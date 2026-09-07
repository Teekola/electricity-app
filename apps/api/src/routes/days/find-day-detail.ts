import * as z from "zod";

import type {
  CheapestHour,
  DataPoint,
  DayDetail,
  IsoDate,
  PeakConsumptionRatioHour,
} from "@repo/api-contract";
import { CHEAPEST_HOURS_COUNT, dailyStatisticsSchema, dataPointSchema } from "@repo/api-contract";

import type { PrismaClient } from "../../generated/prisma/client.js";
import { Prisma } from "../../generated/prisma/client.js";

import { aggregateDailyStatistics } from "./aggregate-daily-statistics.js";

function dayDataPoints(date: IsoDate): Prisma.Sql {
  return Prisma.sql`
    SELECT
      -- starttime is Finnish wall-clock already, so the label is a format, not a conversion.
      TO_CHAR(starttime, 'HH24:MI') AS "hour",
      productionamount::double precision AS "productionMwh",
      -- The source measures consumption in kWh and production in MWh/h.
      (consumptionamount / 1000)::double precision AS "consumptionMwh",
      hourlyprice::double precision AS "priceCentsPerKwh"
    FROM electricitydata
    WHERE date = ${date}::date
    ORDER BY starttime
  `;
}

function dayStatistics(date: IsoDate): Prisma.Sql {
  return Prisma.sql`${aggregateDailyStatistics({ dateFrom: date, dateTo: date })} SELECT * FROM daily`;
}

const dailyStatisticsRowsSchema = z.array(dailyStatisticsSchema);

const dataPointRowsSchema = z.array(dataPointSchema);

/** Every hour attaining the peak, since hours measuring identically are equally the peak. */
export function peakConsumptionRatioHours(
  dataPoints: readonly DataPoint[],
): PeakConsumptionRatioHour[] {
  const ranked = dataPoints.flatMap(({ hour, productionMwh, consumptionMwh }) =>
    productionMwh === null || consumptionMwh === null || productionMwh <= 0
      ? []
      : [
          {
            hour,
            productionMwh,
            consumptionMwh,
            consumptionToProductionRatio: consumptionMwh / productionMwh,
          },
        ],
  );

  const peak = Math.max(
    ...ranked.map(({ consumptionToProductionRatio }) => consumptionToProductionRatio),
  );

  return ranked.filter(({ consumptionToProductionRatio }) => consumptionToProductionRatio === peak);
}

/**
 * Hours the dataset prices identically are equally cheap, so the third cheapest price is a
 * threshold rather than a cut: every hour matching it is reported, and a Day priced flat reports
 * all of its hours.
 */
export function cheapestHours(dataPoints: readonly DataPoint[]): CheapestHour[] {
  const priced = dataPoints
    .flatMap(({ hour, priceCentsPerKwh }) =>
      priceCentsPerKwh === null ? [] : [{ hour, priceCentsPerKwh }],
    )
    // The input is chronological and the sort is stable, so equal prices keep the earlier hour.
    .sort((a, b) => a.priceCentsPerKwh - b.priceCentsPerKwh);

  const threshold = priced[CHEAPEST_HOURS_COUNT - 1]?.priceCentsPerKwh;

  if (threshold === undefined) return priced;

  return priced.filter(({ priceCentsPerKwh }) => priceCentsPerKwh <= threshold);
}

export async function findDayDetail(
  prisma: PrismaClient,
  date: IsoDate,
): Promise<DayDetail | null> {
  const [statisticsRows, dataPointRows] = await Promise.all([
    prisma.$queryRaw(dayStatistics(date)),
    prisma.$queryRaw(dayDataPoints(date)),
  ]);

  const [dailyStatistics] = dailyStatisticsRowsSchema.parse(statisticsRows);

  // The aggregate groups the Day's own Data Points, so no row means no such Day.
  if (dailyStatistics === undefined) return null;

  const dataPoints = dataPointRowsSchema.parse(dataPointRows);

  return {
    dailyStatistics,
    dataPoints,
    peakConsumptionRatioHours: peakConsumptionRatioHours(dataPoints),
    cheapestHours: cheapestHours(dataPoints),
  };
}
