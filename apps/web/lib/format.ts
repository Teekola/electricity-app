import type { IsoDate } from "@repo/api-contract";

const NOT_MEASURED = "—";
const LOCALE = "en-US";

const megawattHours = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 0 });

const centsPerKilowattHour = new Intl.NumberFormat(LOCALE, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const hourlyPrice = new Intl.NumberFormat(LOCALE, {
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
});

const percent = new Intl.NumberFormat(LOCALE, {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
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

/**
 * One hour's price, to the market's own resolution. Day-ahead prices are quoted in €/MWh to two
 * decimals, and 1 c/kWh is 10 €/MWh, so the third decimal here is one tick rather than noise.
 * Dropping it prints hours that were really ranked against each other as equal.
 */
export function formatHourlyPrice(value: number | null): string {
  return value === null ? NOT_MEASURED : hourlyPrice.format(value);
}

/** A fraction, such as an hour's consumption against its own production. */
export function formatPercent(value: number | null): string {
  return value === null ? NOT_MEASURED : percent.format(value);
}

/** The longest Negative Price Streak, which is always measured: zero hours is a real answer. */
export function formatStreak(hours: number): string {
  return `${String(hours)} h`;
}

/**
 * A Day, spelled out and zero-padded to a constant width.
 */
export function formatDay(date: IsoDate): string {
  const [year, month, day] = date.split("-");

  return `${day} ${MONTHS[Number(month) - 1] ?? month} ${year}`;
}

/** Names the Day Detail once, so the tab and the heading cannot drift apart. */
export function formatDayDetailTitle(date: IsoDate): string {
  return `Electricity data on ${formatDay(date)}`;
}
