/**
 * Measured from `db/init-db.tar.gz`: fixture properties, not domain facts. Fine as test inputs,
 * never a reason to narrow a contract type.
 */

/** The newest Day, which is both an Incomplete Day and one that never measured consumption. */
export const NEWEST_DAY = { iso: "2024-10-01", label: "01 Oct 2024" } as const;

export const NEWEST_DAY_HOURS = { withData: 21, inDay: 24 } as const;

/** A complete Day inside the window that measured consumption, 2023-08-01 to 2024-09-29. */
export const DAY_WITH_CONSUMPTION = "2024-01-15";

/**
 * The calendar opens two months ending on the newest Day, so September needs no paging to reach.
 * The labels are react-day-picker's own.
 */
export const CALENDAR = {
  grid: "September 2024",
  from: { label: "September 10th, 2024", iso: "2024-09-10", short: "10 Sep 2024" },
  to: { label: "September 20th, 2024", iso: "2024-09-20", short: "20 Sep 2024" },
} as const;
