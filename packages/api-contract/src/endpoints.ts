import * as z from "zod";

import { dayDetailParamsSchema, dayDetailSchema } from "./day-detail.js";
import { daysListSchema, daysQuerySchema } from "./days.js";
import { healthSchema } from "./health.js";

const NO_PARAMS = z.object({});
const NO_QUERY = z.object({});

/** Paths are spelled the way Fastify declares them, so a `:param` reads the same on both sides. */
export const apiEndpoints = {
  "/health": {
    params: NO_PARAMS,
    query: NO_QUERY,
    response: healthSchema,
  },
  "/days": {
    params: NO_PARAMS,
    query: daysQuerySchema,
    response: daysListSchema,
  },
  "/days/:date": {
    params: dayDetailParamsSchema,
    query: NO_QUERY,
    response: dayDetailSchema,
  },
} as const;

type Endpoints = typeof apiEndpoints;

export type ApiEndpointPath = keyof Endpoints;

export type ApiParams<P extends ApiEndpointPath> = z.output<Endpoints[P]["params"]>;

/** Every query field has a server-side default, so a caller sends only what it changes. */
export type ApiQuery<P extends ApiEndpointPath> = Partial<z.output<Endpoints[P]["query"]>>;

export type ApiResponse<P extends ApiEndpointPath> = z.output<Endpoints[P]["response"]>;
