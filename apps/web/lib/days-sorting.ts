import type { SortingState } from "@tanstack/react-table";

import type { DaysQuery } from "@repo/api-contract";
import { daysSortColumnSchema } from "@repo/api-contract";

export function toSortingState({ sort, dir }: DaysQuery): SortingState {
  return [{ id: sort, desc: dir === "desc" }];
}

/** The inverse of `toSortingState`. The ranking changes under the reader, so the page resets. */
export function fromSortingState(sorting: SortingState, query: DaysQuery): DaysQuery {
  const [column] = sorting;

  if (!column) return query;

  const sort = daysSortColumnSchema.safeParse(column.id);

  // A column id outside the allowlist is a bug in the table, not a request for a 400.
  if (!sort.success) return query;

  return { ...query, page: 1, sort: sort.data, dir: column.desc ? "desc" : "asc" };
}
