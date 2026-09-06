import type { DailyStatisticsMeasure, DailyStatisticsQuery } from "@repo/api-contract";
import { DAILY_STATISTICS_MEASURE_BOUNDS, isNullableMeasure } from "@repo/api-contract";

import { formatDay, formatMwh, formatPrice } from "./format";

interface Measure {
  /** Written out, so lowercasing it reads as prose in a sentence or a label. */
  readonly name: string;
  readonly unit: string;
  readonly format: (value: number) => string;
  /** Only a streak is a whole number of hours; the other measures carry decimals. */
  readonly maxDecimals?: number;
}

const MEASURES: Record<DailyStatisticsMeasure, Measure> = {
  prod: { name: "Production", unit: "MWh", format: formatMwh },
  cons: { name: "Consumption", unit: "MWh", format: formatMwh },
  price: { name: "Average price", unit: "c/kWh", format: formatPrice },
  streak: { name: "Negative streak", unit: "h", format: String, maxDecimals: 0 },
};

export function measureName(measure: DailyStatisticsMeasure): string {
  return MEASURES[measure].name;
}

export function measureUnit(measure: DailyStatisticsMeasure): string {
  return MEASURES[measure].unit;
}

export function measureMaxDecimals(measure: DailyStatisticsMeasure): number | undefined {
  return MEASURES[measure].maxDecimals;
}

/**
 * Why a filtered list can be shorter than the reader expects: a bound on a measure excludes
 * every Day that never measured it, and most Days predate the consumption measurements.
 */
export function describeExcludedDays(measures: readonly DailyStatisticsMeasure[]): string | null {
  const measurements = measures
    .filter(isNullableMeasure)
    .map((measure) => MEASURES[measure].name.toLowerCase());

  if (measurements.length === 0) return null;

  const [last, ...rest] = [...measurements].reverse();
  const named = rest.length === 0 ? last : `${rest.reverse().join(", ")} and ${last}`;

  return `Days that never measured ${named} are excluded.`;
}

export function describeMeasureFilter(
  query: DailyStatisticsQuery,
  measure: DailyStatisticsMeasure,
): string {
  const { name, unit, format } = MEASURES[measure];
  const [minimum, maximum] = DAILY_STATISTICS_MEASURE_BOUNDS[measure];
  const min = query[minimum];
  const max = query[maximum];

  if (min !== undefined && max !== undefined) {
    return `${name} ${format(min)} to ${format(max)} ${unit}`;
  }

  if (min !== undefined) return `${name} at least ${format(min)} ${unit}`;
  if (max !== undefined) return `${name} at most ${format(max)} ${unit}`;

  return name;
}

export function describeDateRange({ dateFrom, dateTo }: DailyStatisticsQuery): string {
  if (dateFrom !== undefined && dateTo !== undefined) {
    return `${formatDay(dateFrom)} – ${formatDay(dateTo)}`;
  }

  if (dateFrom !== undefined) return `From ${formatDay(dateFrom)}`;
  if (dateTo !== undefined) return `Until ${formatDay(dateTo)}`;

  return "All days";
}
