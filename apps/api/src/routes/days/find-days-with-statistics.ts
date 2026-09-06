import * as z from "zod";

import type {
  DailyStatistics,
  DaysList,
  DaysQuery,
  DaysSortColumn,
  SortDirection,
} from "@repo/api-contract";
import {
  DAILY_STATISTICS_MEASURES,
  dailyStatisticsSchema,
  DAYS_MEASURE_BOUNDS,
  FINNISH_TIME_ZONE,
} from "@repo/api-contract";

import type { PrismaClient } from "../../generated/prisma/client.js";
import { Prisma } from "../../generated/prisma/client.js";

/** A column is an identifier, where a bound parameter cannot go, so it is never interpolated. */
const COLUMNS: Record<DaysSortColumn, Prisma.Sql> = {
  date: Prisma.sql`"date"`,
  prod: Prisma.sql`"totalProductionMwh"`,
  cons: Prisma.sql`"totalConsumptionMwh"`,
  price: Prisma.sql`"averagePriceCentsPerKwh"`,
  streak: Prisma.sql`"longestNegativePriceStreakHours"`,
};

const SORT_DIRECTIONS: Record<SortDirection, Prisma.Sql> = {
  asc: Prisma.sql`ASC`,
  desc: Prisma.sql`DESC`,
};

function dateRange({ dateFrom, dateTo }: DaysQuery): Prisma.Sql {
  return Prisma.join(
    [
      dateFrom === undefined ? Prisma.empty : Prisma.sql`AND date >= ${dateFrom}::date`,
      dateTo === undefined ? Prisma.empty : Prisma.sql`AND date <= ${dateTo}::date`,
    ],
    " ",
  );
}

/** Measures exist only once the Data Points are aggregated, so their bounds cannot join above. */
function measureRangeFilter(query: DaysQuery): Prisma.Sql {
  const bounds = DAILY_STATISTICS_MEASURES.flatMap((measure) => {
    const [minimum, maximum] = DAYS_MEASURE_BOUNDS[measure];
    const column = COLUMNS[measure];
    const min = query[minimum];
    const max = query[maximum];

    return [
      ...(min === undefined ? [] : [Prisma.sql`${column} >= ${min}`]),
      ...(max === undefined ? [] : [Prisma.sql`${column} <= ${max}`]),
    ];
  });

  if (bounds.length === 0) return Prisma.empty;

  return Prisma.sql`WHERE ${Prisma.join(bounds, " AND ")}`;
}

/**
 * Aggregates the Data Points of each Day into one row shaped like `dailyStatisticsSchema`,
 * leaving the Days the query asks for in `matching`.
 *
 * The casts are the conversion at the boundary: `NUMERIC` arrives as a `Decimal` and
 * `COUNT` as a `BigInt`, neither of which `JSON.stringify` accepts, and a `DATE` would be
 * parsed into a `Date` in the process's own zone.
 */
function matchingDays(query: DaysQuery): Prisma.Sql {
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
        -- The ::timestamp cast is load-bearing: on a bare date, AT TIME ZONE takes the
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
    ),
    matching AS (
      SELECT * FROM daily ${measureRangeFilter(query)}
    )
  `;
}

/** The window count is computed before the LIMIT, so it counts every matching Day. */
function daysPage(query: DaysQuery): Prisma.Sql {
  return Prisma.sql`
    ${matchingDays(query)}
    SELECT *, COUNT(*) OVER ()::int AS "totalDays"
    FROM matching
    -- The GROUP BY leaves date unique, so it breaks every tie and no Day lands on two pages.
    ORDER BY ${COLUMNS[query.sort]} ${SORT_DIRECTIONS[query.dir]} NULLS LAST, "date" DESC
    LIMIT ${query.size} OFFSET ${(query.page - 1) * query.size}
  `;
}

function matchingDayCount(query: DaysQuery): Prisma.Sql {
  return Prisma.sql`${matchingDays(query)} SELECT COUNT(*)::int AS "totalDays" FROM matching`;
}

const dailyStatisticsRowsSchema = z.array(dailyStatisticsSchema);

const totalDaysSchema = z.object({ totalDays: z.number().int().nonnegative() });

const pageTotalsSchema = z.array(totalDaysSchema);

const countRowsSchema = z.tuple([totalDaysSchema]);

/** Reads one page of Daily Statistics, aggregated per Day from the Data Points. */
export async function findDaysWithStatistics(
  prisma: PrismaClient,
  query: DaysQuery,
): Promise<DaysList> {
  // `$queryRaw` casts its result rather than checking it, hence the parses below.
  const rows = await prisma.$queryRaw(daysPage(query));
  const [totals] = pageTotalsSchema.parse(rows);

  if (totals !== undefined) {
    return page(query, query.page, dailyStatisticsRowsSchema.parse(rows), totals.totalDays);
  }

  // An empty page carries no window count, so a page past the end has to ask for the count
  // on its own. A stale link is not an error: it answers with the last page instead.
  const [{ totalDays }] = countRowsSchema.parse(await prisma.$queryRaw(matchingDayCount(query)));
  const served = Math.min(query.page, Math.max(Math.ceil(totalDays / query.size), 1));

  if (served === query.page) return page(query, served, [], totalDays);

  const lastPage = await prisma.$queryRaw(daysPage({ ...query, page: served }));

  return page(query, served, dailyStatisticsRowsSchema.parse(lastPage), totalDays);
}

function page(
  query: DaysQuery,
  page: number,
  dailyStatistics: DailyStatistics[],
  totalDays: number,
): DaysList {
  return {
    dailyStatistics,
    pagination: {
      page,
      pageSize: query.size,
      totalDays,
      totalPages: Math.ceil(totalDays / query.size),
    },
  };
}
