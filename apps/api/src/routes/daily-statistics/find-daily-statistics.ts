import * as z from "zod";

import type {
  DailyStatisticsList,
  DailyStatisticsQuery,
  DailyStatisticsSortColumn,
  SortDirection,
} from "@repo/api-contract";
import { dailyStatisticsSchema } from "@repo/api-contract";

import type { PrismaClient } from "../../generated/prisma/client.js";
import { Prisma } from "../../generated/prisma/client.js";

/** A sort column is an identifier, where a bound parameter cannot go, so it is never interpolated. */
const SORT_COLUMNS: Record<DailyStatisticsSortColumn, Prisma.Sql> = {
  date: Prisma.sql`"date"`,
  totalProductionMwh: Prisma.sql`"totalProductionMwh"`,
  totalConsumptionMwh: Prisma.sql`"totalConsumptionMwh"`,
  averagePriceCentsPerKwh: Prisma.sql`"averagePriceCentsPerKwh"`,
  longestNegativePriceStreakHours: Prisma.sql`"longestNegativePriceStreakHours"`,
};

const SORT_DIRECTIONS: Record<SortDirection, Prisma.Sql> = {
  asc: Prisma.sql`ASC`,
  desc: Prisma.sql`DESC`,
};

const FINNISH_TIME_ZONE = "Europe/Helsinki";

function dateRange({ dateFrom, dateTo }: DailyStatisticsQuery): Prisma.Sql {
  return Prisma.join(
    [
      dateFrom === undefined ? Prisma.empty : Prisma.sql`AND date >= ${dateFrom}::date`,
      dateTo === undefined ? Prisma.empty : Prisma.sql`AND date <= ${dateTo}::date`,
    ],
    " ",
  );
}

/**
 * Aggregates the Data Points of each Day into one row shaped like `dailyStatisticsSchema`.
 *
 * The casts are the conversion at the boundary: `NUMERIC` arrives as a `Decimal` and
 * `COUNT` as a `BigInt`, neither of which `JSON.stringify` accepts, and a `DATE` would be
 * parsed into a `Date` in the process's own zone.
 */
function dailyStatistics(query: DailyStatisticsQuery): Prisma.Sql {
  return Prisma.sql`
    WITH data_points AS (
      SELECT
        date,
        -- Instants, so "the next hour" survives a clock change: 01:00 and 03:00 on a
        -- spring-forward Day really are an hour apart.
        starttime AT TIME ZONE ${FINNISH_TIME_ZONE} AS instant,
        hourlyprice,
        productionamount,
        consumptionamount
      FROM electricitydata
      WHERE date IS NOT NULL ${dateRange(query)}
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
        TO_CHAR(data_points.date, 'YYYY-MM-DD') AS "date",
        SUM(productionamount)::double precision AS "totalProductionMwh",
        -- The source measures consumption in kWh and production in MWh/h.
        (SUM(consumptionamount) / 1000)::double precision AS "totalConsumptionMwh",
        -- AVG skips NULLs, so the divisor is the hours that carry a price, never 24.
        AVG(hourlyprice)::double precision AS "averagePriceCentsPerKwh",
        COALESCE(MAX(streak.hours), 0)::int AS "longestNegativePriceStreakHours",
        COUNT(*)::int AS "hoursWithData",
        -- The ::timestamp cast is load-bearing: AT TIME ZONE on a bare date takes the
        -- timestamptz overload, which reads local midnight as UTC and inverts the clock
        -- change, reporting 25 hours for a spring-forward Day and 23 for a fall-back one.
        (EXTRACT(
          EPOCH FROM
            (data_points.date + 1)::timestamp AT TIME ZONE ${FINNISH_TIME_ZONE}
            - data_points.date::timestamp AT TIME ZONE ${FINNISH_TIME_ZONE}
        ) / 3600)::int AS "hoursInDay"
      FROM data_points
      LEFT JOIN longest_negative_price_streak AS streak ON streak.date = data_points.date
      GROUP BY data_points.date
    )
    SELECT * FROM daily
    -- The unique date breaks ties, so no Day can land on two pages.
    ORDER BY ${SORT_COLUMNS[query.sortBy]} ${SORT_DIRECTIONS[query.sortDirection]} NULLS LAST, "date" DESC
    LIMIT ${query.pageSize} OFFSET ${(query.page - 1) * query.pageSize}
  `;
}

function totalDays(query: DailyStatisticsQuery): Prisma.Sql {
  return Prisma.sql`
    SELECT COUNT(DISTINCT date)::int AS "totalDays"
    FROM electricitydata
    WHERE date IS NOT NULL ${dateRange(query)}
  `;
}

const dailyStatisticsRowsSchema = z.array(dailyStatisticsSchema);

const totalDaysRowsSchema = z.tuple([z.object({ totalDays: z.number().int().nonnegative() })]);

/** Reads one page of Daily Statistics, aggregated per Day from the Data Points. */
export async function findDailyStatistics(
  prisma: PrismaClient,
  query: DailyStatisticsQuery,
): Promise<DailyStatisticsList> {
  const [rows, totals] = await Promise.all([
    // `$queryRaw` casts its result rather than checking it, hence the parse below.
    prisma.$queryRaw(dailyStatistics(query)),
    prisma.$queryRaw(totalDays(query)),
  ]);

  const [{ totalDays: days }] = totalDaysRowsSchema.parse(totals);
  const totalPages = Math.ceil(days / query.pageSize);

  // A page past the end is a stale link, not an error, so it answers with the last page. The
  // count is only known now, so the common case still costs the two parallel queries above.
  const page = Math.min(query.page, Math.max(totalPages, 1));

  return {
    dailyStatistics: dailyStatisticsRowsSchema.parse(
      page === query.page ? rows : await prisma.$queryRaw(dailyStatistics({ ...query, page })),
    ),
    pagination: {
      page,
      pageSize: query.pageSize,
      totalDays: days,
      totalPages,
    },
  };
}
