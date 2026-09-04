import type { IsoDate } from "@repo/api-contract";

const NOT_MEASURED = "—";
const LOCALE = "en-US";

const megawattHours = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 0 });

const centsPerKilowattHour = new Intl.NumberFormat(LOCALE, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

export function formatMwh(value: number | null): string {
  return value === null ? NOT_MEASURED : megawattHours.format(value);
}

/** An average price, in cents per kWh. */
export function formatPrice(value: number | null): string {
  return value === null ? NOT_MEASURED : centsPerKilowattHour.format(value);
}

/** The longest Negative Price Streak. Zero is measured, not missing, hence an en dash. */
export function formatStreak(hours: number): string {
  return hours === 0 ? "–" : `${String(hours)} h`;
}

/**
 * A Day, spelled out and zero-padded to a constant width. Read straight from the ISO
 * string rather than through a `Date`, which resolves midnight in the reader's zone.
 */
export function formatDay(date: IsoDate): string {
  const [year, month, day] = date.split("-");

  return `${day} ${MONTHS[Number(month) - 1] ?? month} ${year}`;
}
