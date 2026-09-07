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
} from "@repo/api-contract";

import type { PrismaClient } from "../../generated/prisma/client.js";
import { Prisma } from "../../generated/prisma/client.js";

import { aggregateDailyStatistics } from "./aggregate-daily-statistics.js";

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

/** The Days this query asks for, filtered on measures that exist only once aggregated. */
function matchingDays(query: DaysQuery): Prisma.Sql {
  return Prisma.sql`
    ${aggregateDailyStatistics(query)},
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
