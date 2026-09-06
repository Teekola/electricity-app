import type { SortingState } from "@tanstack/react-table";

import type { DailyStatisticsQuery } from "@repo/api-contract";
import { dailyStatisticsSortColumnSchema } from "@repo/api-contract";

export function toSortingState({ sort, dir }: DailyStatisticsQuery): SortingState {
  return [{ id: sort, desc: dir === "desc" }];
}

/** The inverse of `toSortingState`. The ranking changes under the reader, so the page resets. */
export function fromSortingState(
  sorting: SortingState,
  query: DailyStatisticsQuery,
): DailyStatisticsQuery {
  const [column] = sorting;

  if (!column) return query;

  const sort = dailyStatisticsSortColumnSchema.safeParse(column.id);

  // A column id outside the allowlist is a bug in the table, not a request for a 400.
  if (!sort.success) return query;

  return { ...query, page: 1, sort: sort.data, dir: column.desc ? "desc" : "asc" };
}
