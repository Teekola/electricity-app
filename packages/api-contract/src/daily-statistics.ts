import * as z from "zod";

export const isoDateSchema = z.iso.date();
export type IsoDate = z.infer<typeof isoDateSchema>;

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

/**
 * The allowlist of sortable columns. A sort column reaches SQL as an identifier, where
 * `Prisma.sql` parameters cannot protect it.
 */
export const DAILY_STATISTICS_SORT_COLUMNS = [
  "date",
  "totalProductionMwh",
  "totalConsumptionMwh",
  "averagePriceCentsPerKwh",
  "longestNegativePriceStreakHours",
] as const;

export const dailyStatisticsSortColumnSchema = z.enum(DAILY_STATISTICS_SORT_COLUMNS);

export type DailyStatisticsSortColumn = z.infer<typeof dailyStatisticsSortColumnSchema>;

export const sortDirectionSchema = z.enum(["asc", "desc"]);

export type SortDirection = z.infer<typeof sortDirectionSchema>;

export const dailyStatisticsQuerySchema = z
  .object({
    page: z.coerce.number().int().positive().default(1),
    pageSize: z.coerce.number().int().positive().max(200).default(50),
    sortBy: dailyStatisticsSortColumnSchema.default("date"),
    sortDirection: sortDirectionSchema.default("desc"),
    dateFrom: isoDateSchema.optional(),
    dateTo: isoDateSchema.optional(),
  })
  .refine(({ dateFrom, dateTo }) => !dateFrom || !dateTo || dateFrom <= dateTo, {
    error: "dateFrom must not be later than dateTo",
    path: ["dateFrom"],
  });

export type DailyStatisticsQuery = z.infer<typeof dailyStatisticsQuerySchema>;

export const paginationSchema = z.object({
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  totalDays: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
});

export type Pagination = z.infer<typeof paginationSchema>;

export const dailyStatisticsListSchema = z.object({
  dailyStatistics: z.array(dailyStatisticsSchema),
  pagination: paginationSchema,
});

export type DailyStatisticsList = z.infer<typeof dailyStatisticsListSchema>;
