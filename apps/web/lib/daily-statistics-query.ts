import type { SortingState } from "@tanstack/react-table";
import * as z from "zod";

import type { DailyStatisticsQuery } from "@repo/api-contract";
import {
  dailyStatisticsQuerySchema,
  dailyStatisticsSortColumnSchema,
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

/** The search params Next hands a page: a repeated parameter arrives as an array. */
export type SearchParams = Record<string, string | string[] | undefined>;

/** The query a URL asks for. Each field falls back on its own, so one bad parameter cannot
 * discard the reader's other choices. */
export function parseDailyStatisticsQuery(searchParams: SearchParams): DailyStatisticsQuery {
  const fields = Object.fromEntries(
    Object.entries(dailyStatisticsQuerySchema.shape).flatMap(([field, schema]) => {
      const result = (field === "pageSize" ? clampedPageSizeSchema : schema).safeParse(
        searchParams[field],
      );

      return result.success ? [[field, result.data]] : [];
    }),
  );

  const result = dailyStatisticsQuerySchema.safeParse(fields);

  if (result.success) return result.data;

  // The Day range is the contract's only cross-field rule, and it means nothing half-dropped.
  return dailyStatisticsQuerySchema.parse({ ...fields, dateFrom: undefined, dateTo: undefined });
}

/** The inverse of `parseDailyStatisticsQuery`: the search params that ask for this query. */
export function toSearchParams(query: DailyStatisticsQuery): URLSearchParams {
  const params = new URLSearchParams();

  for (const [field, value] of Object.entries(query)) {
    if (value !== undefined) params.set(field, String(value));
  }

  return params;
}

/** The same list at a new page size. A position means nothing at another size, so the page resets. */
export function withPageSize(query: DailyStatisticsQuery, pageSize: number): DailyStatisticsQuery {
  return { ...query, page: 1, pageSize };
}

/** The same ordering, in the shape the table's headers read. */
export function toSortingState({ sortBy, sortDirection }: DailyStatisticsQuery): SortingState {
  return [{ id: sortBy, desc: sortDirection === "desc" }];
}

/** The inverse of `toSortingState`. The ranking changes under the reader, so the page resets. */
export function fromSortingState(
  sorting: SortingState,
  query: DailyStatisticsQuery,
): DailyStatisticsQuery {
  const [column] = sorting;

  if (!column) return query;

  const sortBy = dailyStatisticsSortColumnSchema.safeParse(column.id);

  // A column id outside the allowlist is a bug in the table, not a request for a 400.
  if (!sortBy.success) return query;

  return {
    ...query,
    page: 1,
    sortBy: sortBy.data,
    sortDirection: column.desc ? "desc" : "asc",
  };
}
