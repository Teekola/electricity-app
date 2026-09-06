import * as z from "zod";

import type { DailyStatisticsMeasure, DailyStatisticsQuery, IsoDate } from "@repo/api-contract";
import {
  DAILY_STATISTICS_MEASURE_BOUNDS,
  DAILY_STATISTICS_MEASURES,
  DAILY_STATISTICS_RANGES,
  dailyStatisticsQuerySchema,
  MAX_DAILY_STATISTICS_PAGE_SIZE,
} from "@repo/api-contract";

/**
 * A hand-typed page size outside the contract's bounds is clamped rather than dropped: dropping
 * it would fall back to the default size while keeping the page number the larger size implied,
 * which reads as the size having been ignored.
 */
const clampedPageSizeSchema = z.coerce
  .number()
  .int()
  .transform((size) => Math.min(Math.max(size, 1), MAX_DAILY_STATISTICS_PAGE_SIZE));

const DEFAULTS = new Map<string, unknown>(
  Object.entries(dailyStatisticsQuerySchema.parse({})).filter(([, value]) => value !== undefined),
);

export type MeasureBound = (typeof DAILY_STATISTICS_MEASURE_BOUNDS)[DailyStatisticsMeasure][number];

export type MeasureRanges = Record<MeasureBound, number | undefined>;

/** The search params Next hands a page: a repeated parameter arrives as an array. */
export type SearchParams = Record<string, string | string[] | undefined>;

/**
 * Each field falls back on its own, so one bad parameter cannot discard the reader's other
 * choices.
 */
export function parseDailyStatisticsQuery(searchParams: SearchParams): DailyStatisticsQuery {
  const fields = Object.fromEntries(
    Object.entries(dailyStatisticsQuerySchema.shape).flatMap(([field, schema]) => {
      const result = (field === "size" ? clampedPageSizeSchema : schema).safeParse(
        searchParams[field],
      );

      return result.success && result.data !== undefined ? [[field, result.data]] : [];
    }),
  );

  const result = dailyStatisticsQuerySchema.safeParse(
    withoutEmptyBounds(withOrderedRanges(fields)),
  );

  return result.success ? result.data : dailyStatisticsQuerySchema.parse({});
}

// A streak of at least zero hours excludes no Day, so a URL carrying one asks for no filter.
function withoutEmptyBounds(fields: Record<string, unknown>): Record<string, unknown> {
  if (fields["streakMin"] !== 0) return fields;

  const { streakMin: _, ...rest } = fields;

  return rest;
}

// A range that runs backwards means nothing half-dropped, so both its bounds go, and only those.
function withOrderedRanges(fields: Record<string, unknown>): Record<string, unknown> {
  const ordered = { ...fields };

  for (const [minimum, maximum] of DAILY_STATISTICS_RANGES) {
    if (isOrdered(ordered[minimum], ordered[maximum])) continue;

    delete ordered[minimum];
    delete ordered[maximum];
  }

  return ordered;
}

function isOrdered(min: unknown, max: unknown): boolean {
  if (typeof min === "number" && typeof max === "number") return min <= max;
  if (typeof min === "string" && typeof max === "string") return min <= max;

  return true;
}

export function toSearchParams(query: DailyStatisticsQuery): URLSearchParams {
  const params = new URLSearchParams();

  for (const [field, value] of Object.entries(query)) {
    // What the contract would default to anyway is left out, so a URL carries only real choices.
    if (value === undefined || DEFAULTS.get(field) === value) continue;

    params.set(field, String(value));
  }

  return params;
}

export function withPageSize(query: DailyStatisticsQuery, size: number): DailyStatisticsQuery {
  return { ...query, page: 1, size };
}

export function withDateRange(
  query: DailyStatisticsQuery,
  dateFrom: IsoDate | undefined,
  dateTo: IsoDate | undefined,
): DailyStatisticsQuery {
  return { ...query, page: 1, dateFrom, dateTo };
}

export function withMeasureRanges(
  query: DailyStatisticsQuery,
  ranges: MeasureRanges,
): DailyStatisticsQuery {
  // The parser drops a zero streak bound too; doing it here keeps the optimistic query honest
  // before the URL it produces is ever read back.
  return {
    ...query,
    ...ranges,
    streakMin: ranges.streakMin === 0 ? undefined : ranges.streakMin,
    page: 1,
  };
}

export function withoutMeasure(
  query: DailyStatisticsQuery,
  measure: DailyStatisticsMeasure,
): DailyStatisticsQuery {
  const [minimum, maximum] = DAILY_STATISTICS_MEASURE_BOUNDS[measure];

  return { ...query, page: 1, [minimum]: undefined, [maximum]: undefined };
}

export function withoutFilters(query: DailyStatisticsQuery): DailyStatisticsQuery {
  return withDateRange(
    withMeasureRanges(
      query,
      collectRanges(() => undefined),
    ),
    undefined,
    undefined,
  );
}

export function collectRanges(read: (bound: MeasureBound) => number | undefined): MeasureRanges {
  return Object.fromEntries(
    DAILY_STATISTICS_MEASURES.flatMap((measure) =>
      DAILY_STATISTICS_MEASURE_BOUNDS[measure].map((bound) => [bound, read(bound)]),
    ),
  ) as MeasureRanges; // `Object.fromEntries` widens the keys it was given back to `string`.
}

export function measureRanges(query: DailyStatisticsQuery): MeasureRanges {
  return collectRanges((bound) => query[bound]);
}

export function filteredMeasures(query: DailyStatisticsQuery): DailyStatisticsMeasure[] {
  return DAILY_STATISTICS_MEASURES.filter((measure) =>
    DAILY_STATISTICS_MEASURE_BOUNDS[measure].some((bound) => query[bound] !== undefined),
  );
}

export function hasFilters(query: DailyStatisticsQuery): boolean {
  return (
    query.dateFrom !== undefined || query.dateTo !== undefined || filteredMeasures(query).length > 0
  );
}
