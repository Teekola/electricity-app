import * as z from "zod";

import { daysListSchema, daysQuerySchema } from "./days.js";
import { healthSchema } from "./health.js";

export const apiEndpoints = {
  "/health": {
    query: z.object({}),
    response: healthSchema,
  },
  "/days": {
    query: daysQuerySchema,
    response: daysListSchema,
  },
} as const;

type Endpoints = typeof apiEndpoints;

export type ApiEndpointPath = keyof Endpoints;

/** Every query field has a server-side default, so a caller sends only what it changes. */
export type ApiQuery<P extends ApiEndpointPath> = Partial<z.output<Endpoints[P]["query"]>>;

export type ApiResponse<P extends ApiEndpointPath> = z.output<Endpoints[P]["response"]>;
