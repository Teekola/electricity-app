import { cacheLife, cacheTag } from "next/cache";

import type { DailyStatisticsList, DailyStatisticsQuery } from "@repo/api-contract";

import { fetchFromApi } from "./api";

export async function getDailyStatistics(
  query: DailyStatisticsQuery,
): Promise<DailyStatisticsList> {
  "use cache";
  cacheLife("max");
  cacheTag("daily-statistics");

  return fetchFromApi("/daily-statistics", query);
}
