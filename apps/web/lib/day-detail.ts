import { cacheLife, cacheTag } from "next/cache";

import type { DayDetail, IsoDate } from "@repo/api-contract";

import { ApiResponseError, fetchFromApi } from "./api";

export async function getDayDetail(date: IsoDate): Promise<DayDetail | null> {
  "use cache";
  cacheLife("max");
  cacheTag("day-detail");

  try {
    return await fetchFromApi("/days/:date", { params: { date } });
  } catch (error) {
    if (error instanceof ApiResponseError && error.status === 404) return null;

    throw error;
  }
}
