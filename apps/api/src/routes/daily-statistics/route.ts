import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";

import type { ApiEndpointPath, DailyStatisticsList } from "@repo/api-contract";
import { apiEndpoints } from "@repo/api-contract";

import { findDailyStatistics } from "./find-daily-statistics.js";

const path = "/daily-statistics" as const satisfies ApiEndpointPath;
const endpoint = apiEndpoints[path];

export function dailyStatisticsRoutes(app: FastifyInstance): void {
  const api = app.withTypeProvider<ZodTypeProvider>();
  api.get(
    path,
    {
      schema: {
        querystring: endpoint.query,
        response: { 200: endpoint.response },
      },
    },
    (request): Promise<DailyStatisticsList> => findDailyStatistics(app.prisma, request.query),
  );
}
