import * as z from "zod";

export const API_ERROR_CODES = ["BAD_REQUEST", "NOT_FOUND", "INTERNAL_ERROR"] as const;

export const apiErrorCodeSchema = z.enum(API_ERROR_CODES);

export type ApiErrorCode = z.infer<typeof apiErrorCodeSchema>;

export const apiErrorSchema = z.object({
  statusCode: z.number().int(),
  code: apiErrorCodeSchema,
  message: z.string(),
  /** Present only on `BAD_REQUEST`. */
  issues: z
    .array(
      z.object({
        path: z.string(),
        message: z.string(),
      }),
    )
    .optional(),
});

export type ApiError = z.infer<typeof apiErrorSchema>;
