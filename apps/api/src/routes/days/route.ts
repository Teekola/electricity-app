import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";

import type { ApiEndpointPath, DaysList } from "@repo/api-contract";
import { apiEndpoints } from "@repo/api-contract";

import { findDaysWithStatistics } from "./find-days-with-statistics.js";

const path = "/days" as const satisfies ApiEndpointPath;
const endpoint = apiEndpoints[path];

export function daysRoutes(app: FastifyInstance): void {
  const api = app.withTypeProvider<ZodTypeProvider>();
  api.get(
    path,
    {
      schema: {
        querystring: endpoint.query,
        response: { 200: endpoint.response },
      },
    },
    (request): Promise<DaysList> => findDaysWithStatistics(app.prisma, request.query),
  );
}
