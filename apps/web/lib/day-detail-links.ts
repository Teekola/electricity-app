import type { DaysQuery, IsoDate } from "@repo/api-contract";

import { parseDaysQuery, type SearchParams, toSearchParams } from "./days-query";

function withSearch(path: string, search: string): string {
  return search === "" ? path : `${path}?${search}`;
}

/**
 * A Day Detail carries the list it was reached from in its own address, so the reader can return
 * to that exact list without a history entry to go back to.
 */
export function dayHref(date: IsoDate, query: DaysQuery): string {
  return withSearch(`/days/${date}`, toSearchParams(query).toString());
}

/** The list a Day Detail's address describes, read back through the parser so junk cannot survive. */
export function listHref(searchParams: SearchParams): string {
  return withSearch("/", toSearchParams(parseDaysQuery(searchParams)).toString());
}
