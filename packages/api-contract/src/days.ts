import * as z from "zod";

import { isoDateSchema } from "./day.js";

export const dailyStatisticsSchema = z.object({
  date: isoDateSchema,
  totalProductionMwh: z.number().nullable(),
  totalConsumptionMwh: z.number().nullable(),
  averagePriceCentsPerKwh: z.number().nullable(),
  longestNegativePriceStreakHours: z.number().int().nonnegative(),
  hoursWithData: z.number().int().positive(),
  hoursInDay: z.number().int().positive(),
});

export type DailyStatistics = z.infer<typeof dailyStatisticsSchema>;

export const DAILY_STATISTICS_MEASURES = ["prod", "cons", "price", "streak"] as const;

export const dailyStatisticsMeasureSchema = z.enum(DAILY_STATISTICS_MEASURES);

export type DailyStatisticsMeasure = z.infer<typeof dailyStatisticsMeasureSchema>;

/**
 * The allowlist of sortable columns. A sort column reaches SQL as an identifier, where
 * `Prisma.sql` parameters cannot protect it.
 */
export const DAYS_SORT_COLUMNS = ["date", ...DAILY_STATISTICS_MEASURES] as const;

export const daysSortColumnSchema = z.enum(DAYS_SORT_COLUMNS);

export type DaysSortColumn = z.infer<typeof daysSortColumnSchema>;

export const sortDirectionSchema = z.enum(["asc", "desc"]);

export type SortDirection = z.infer<typeof sortDirectionSchema>;

export const DAYS_PAGE_SIZES = [25, 50, 100, 200] as const;

export const DEFAULT_DAYS_PAGE_SIZE = 50;

export const MAX_DAYS_PAGE_SIZE = 200;

/**
 * An untouched field submits as blank, and `Number("")` is 0, so a blank has to be read as
 * no bound before coercion ever sees it.
 */
const blankSchema = z.string().refine((value) => value.trim() === "");

const optionalNumberSchema = z
  .union([blankSchema, z.coerce.number()])
  .transform((value) => (typeof value === "string" ? undefined : value))
  .optional();

const daysQueryFieldsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  size: z.coerce.number().int().positive().max(MAX_DAYS_PAGE_SIZE).default(DEFAULT_DAYS_PAGE_SIZE),
  sort: daysSortColumnSchema.default("date"),
  dir: sortDirectionSchema.default("desc"),
  dateFrom: isoDateSchema.optional(),
  dateTo: isoDateSchema.optional(),
  prodMin: optionalNumberSchema,
  prodMax: optionalNumberSchema,
  consMin: optionalNumberSchema,
  consMax: optionalNumberSchema,
  priceMin: optionalNumberSchema,
  priceMax: optionalNumberSchema,
  streakMin: optionalNumberSchema,
  streakMax: optionalNumberSchema,
});

export const DAYS_MEASURE_BOUNDS = {
  prod: ["prodMin", "prodMax"],
  cons: ["consMin", "consMax"],
  price: ["priceMin", "priceMax"],
  streak: ["streakMin", "streakMax"],
} as const satisfies Record<DailyStatisticsMeasure, readonly [string, string]>;

export const DAILY_STATISTICS_MEASURE_FIELDS = {
  prod: "totalProductionMwh",
  cons: "totalConsumptionMwh",
  price: "averagePriceCentsPerKwh",
  streak: "longestNegativePriceStreakHours",
} as const satisfies Record<DailyStatisticsMeasure, keyof DailyStatistics>;

/** A bound on a nullable measure also drops every Day that never measured it. */
export function isNullableMeasure(measure: DailyStatisticsMeasure): boolean {
  return dailyStatisticsSchema.shape[DAILY_STATISTICS_MEASURE_FIELDS[measure]].safeParse(null)
    .success;
}

/** The bounds of every range a query can carry, so a caller can treat each pair as one choice. */
export const DAYS_QUERY_RANGES = [
  ["dateFrom", "dateTo"],
  ...Object.values(DAYS_MEASURE_BOUNDS),
] as const satisfies readonly (readonly [string, string])[];

function isAscending(min: number | undefined, max: number | undefined): boolean {
  return min === undefined || max === undefined || min <= max;
}

export const daysQuerySchema = Object.values(DAYS_MEASURE_BOUNDS).reduce(
  (schema, [min, max]) =>
    schema.refine((query) => isAscending(query[min], query[max]), {
      error: `${min} must not be greater than ${max}`,
      path: [min],
    }),
  daysQueryFieldsSchema.refine(
    ({ dateFrom, dateTo }) => !dateFrom || !dateTo || dateFrom <= dateTo,
    { error: "dateFrom must not be later than dateTo", path: ["dateFrom"] },
  ),
);

export type DaysQuery = z.infer<typeof daysQuerySchema>;

export const paginationSchema = z.object({
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  totalDays: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
});

export type Pagination = z.infer<typeof paginationSchema>;

export const daysListSchema = z.object({
  dailyStatistics: z.array(dailyStatisticsSchema),
  pagination: paginationSchema,
});

export type DaysList = z.infer<typeof daysListSchema>;
