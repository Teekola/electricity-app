import type { DailyStatistics } from "@repo/api-contract";

type DayHours = Pick<DailyStatistics, "hoursInDay" | "hoursWithData">;

/** A Day the dataset does not cover in full. Days in the dataset are not uniformly 24 hours long, hence
 * measuring against the Day's own length. */
export function isIncompleteDay({ hoursWithData, hoursInDay }: DayHours): boolean {
  return hoursWithData !== hoursInDay;
}

export function describeIncompleteness(day: DayHours): string | null {
  if (!isIncompleteDay(day)) return null;

  return `Incomplete day: the dataset holds ${String(day.hoursWithData)} of ${String(day.hoursInDay)} hours, so these totals are not comparable to a full day's`;
}
