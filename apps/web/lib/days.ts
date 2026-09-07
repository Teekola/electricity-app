import { cacheLife, cacheTag } from "next/cache";

import type { DaysList, DaysQuery } from "@repo/api-contract";

import { fetchFromApi } from "./api";

export async function getDaysWithStatistics(query: DaysQuery): Promise<DaysList> {
  "use cache";
  cacheLife("max");
  cacheTag("days");

  return fetchFromApi("/days", { query });
}
