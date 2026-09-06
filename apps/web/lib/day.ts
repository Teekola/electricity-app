import type { IsoDate } from "@repo/api-contract";

/**
 * The Day a calendar selection means. `toISOString` would name the Day before anywhere
 * ahead of UTC, Finland included, so the local parts are read instead.
 */
export function toIsoDate(date: Date): IsoDate {
  const year = String(date.getFullYear()).padStart(4, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

/** Local midnight, so the calendar highlights the Day it was given. */
export function fromIsoDate(date: IsoDate): Date {
  const [year, month, day] = date.split("-");

  return new Date(Number(year), Number(month) - 1, Number(day));
}
