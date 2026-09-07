/**
 * A ceiling shared across Days was tried and dropped: one wide enough for the Days whose prices
 * spike leaves a typical Day as stubs, and comparing Days is the list's job. The floor only
 * clears zero, so an hour dipping barely below it still reads as negative.
 */
export const PRICE_AXIS_FLOOR = -1;

export const priceAxisDomain = [
  (dataMin: number) => Math.min(PRICE_AXIS_FLOOR, dataMin),
  "auto",
] as const;

/**
 * The hour axis both charts draw. Recharts keeps the widest evenly spaced set of ticks that still
 * leaves `minTickGap` between them; a fixed `interval` is the same count at every width.
 */
export const hourAxisProps = {
  dataKey: "hour",
  tickLine: false,
  axisLine: false,
  tickMargin: 8,
  interval: "equidistantPreserveStart",
  minTickGap: 16,
} as const;
