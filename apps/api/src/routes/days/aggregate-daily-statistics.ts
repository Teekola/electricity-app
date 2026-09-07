import type { IsoDate } from "@repo/api-contract";
import { FINNISH_TIME_ZONE } from "@repo/api-contract";

import { Prisma } from "../../generated/prisma/client.js";

export interface DateRange {
  readonly dateFrom?: IsoDate;
  readonly dateTo?: IsoDate;
}

function dateRange({ dateFrom, dateTo }: DateRange): Prisma.Sql {
  return Prisma.join(
    [
      dateFrom === undefined ? Prisma.empty : Prisma.sql`AND date >= ${dateFrom}::date`,
      dateTo === undefined ? Prisma.empty : Prisma.sql`AND date <= ${dateTo}::date`,
    ],
    " ",
  );
}

/**
 * Aggregates the Data Points of each Day in the range into one row shaped like
 * `dailyStatisticsSchema`, left in a CTE named `daily` for the caller to select from. The list
 * and the Day Detail both select from it, so a Day cannot read differently in the two views.
 */
export function aggregateDailyStatistics(range: DateRange): Prisma.Sql {
  return Prisma.sql`
    WITH data_points AS (
      SELECT
        date,
        -- Convert Finnish local time to an absolute instant, so elapsed time stays correct
        -- across a clock change: 01:00 → 03:00 on a spring-forward Day is exactly one hour.
        starttime AT TIME ZONE ${FINNISH_TIME_ZONE} AS instant,
        hourlyprice,
        productionamount,
        consumptionamount
      FROM electricitydata
      WHERE date IS NOT NULL ${dateRange(range)}
    ),
    negative_price_hours AS (
      SELECT
        date,
        instant,
        LAG(instant) OVER (PARTITION BY date ORDER BY instant) AS previous_instant
      FROM data_points
      WHERE hourlyprice < 0
    ),
    -- Gaps and islands. Partitioning by date stops a run at midnight.
    negative_price_islands AS (
      SELECT
        date,
        SUM(CASE WHEN instant - previous_instant = INTERVAL '1 hour' THEN 0 ELSE 1 END)
          OVER (PARTITION BY date ORDER BY instant) AS island
      FROM negative_price_hours
    ),
    longest_negative_price_streak AS (
      SELECT date, MAX(hours) AS hours
      FROM (
        SELECT date, island, COUNT(*) AS hours
        FROM negative_price_islands
        GROUP BY date, island
      ) AS islands
      GROUP BY date
    ),
    daily AS (
      SELECT
        -- Converted here rather than in TypeScript: NUMERIC arrives as a Decimal and COUNT as a
        -- BigInt, neither of which JSON.stringify accepts, and a DATE would be parsed into a Date
        -- in the process's own zone.
        TO_CHAR(data_points.date, 'YYYY-MM-DD') AS "date",
        SUM(productionamount)::double precision AS "totalProductionMwh",
        -- The source measures consumption in kWh and production in MWh/h.
        (SUM(consumptionamount) / 1000)::double precision AS "totalConsumptionMwh",
        -- AVG skips NULLs, so the divisor is the hours that carry a price.
        AVG(hourlyprice)::double precision AS "averagePriceCentsPerKwh",
        COALESCE(MAX(streak.hours), 0)::int AS "longestNegativePriceStreakHours",
        COUNT(*)::int AS "hoursWithData",
        -- Without ::timestamp, AT TIME ZONE takes its timestamptz overload and the clock
        -- change comes out backwards: 25 hours for a spring-forward Day, 23 for a fall-back one.
        (EXTRACT(
          EPOCH FROM
            (data_points.date + 1)::timestamp AT TIME ZONE ${FINNISH_TIME_ZONE}
            - data_points.date::timestamp AT TIME ZONE ${FINNISH_TIME_ZONE}
        ) / 3600)::int AS "hoursInDay"
      FROM data_points
      LEFT JOIN longest_negative_price_streak AS streak ON streak.date = data_points.date
      GROUP BY data_points.date
    )
  `;
}
