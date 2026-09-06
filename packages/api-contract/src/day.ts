import * as z from "zod";

export const isoDateSchema = z.iso.date();
export type IsoDate = z.infer<typeof isoDateSchema>;

/** The zone the dataset's own timestamps are in, and the one a Day is a calendar day of. */
export const FINNISH_TIME_ZONE = "Europe/Helsinki";
