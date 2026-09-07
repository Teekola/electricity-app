import * as z from "zod";

import { isoDateSchema } from "./day.js";
import { dailyStatisticsSchema } from "./days.js";

/** Finnish wall-clock time. The Day the endpoint names fixes the zone, so an hour never repeats it. */
export const hourSchema = z.string().regex(/^\d{2}:\d{2}$/, "must be an HH:mm hour");

export type Hour = z.infer<typeof hourSchema>;

export const dataPointSchema = z.object({
  hour: hourSchema,
  productionMwh: z.number().nullable(),
  consumptionMwh: z.number().nullable(),
  priceCentsPerKwh: z.number().nullable(),
});

export type DataPoint = z.infer<typeof dataPointSchema>;

export const peakConsumptionRatioHourSchema = z.object({
  hour: hourSchema,
  productionMwh: z.number(),
  consumptionMwh: z.number(),
  consumptionToProductionRatio: z.number(),
});

export type PeakConsumptionRatioHour = z.infer<typeof peakConsumptionRatioHourSchema>;

export const cheapestHourSchema = z.object({
  hour: hourSchema,
  priceCentsPerKwh: z.number(),
});

export type CheapestHour = z.infer<typeof cheapestHourSchema>;

/** How many Cheapest Hours a Day reports before a tie with the third extends the list. */
export const CHEAPEST_HOURS_COUNT = 3;

export const dayDetailSchema = z.object({
  dailyStatistics: dailyStatisticsSchema,
  dataPoints: z.array(dataPointSchema),
  peakConsumptionRatioHours: z.array(peakConsumptionRatioHourSchema),
  cheapestHours: z.array(cheapestHourSchema),
});

export type DayDetail = z.infer<typeof dayDetailSchema>;

export const dayDetailParamsSchema = z.object({ date: isoDateSchema });

export type DayDetailParams = z.infer<typeof dayDetailParamsSchema>;
