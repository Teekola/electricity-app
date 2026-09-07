import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";

import type { ApiEndpointPath, ApiError, DaysList } from "@repo/api-contract";
import { apiEndpoints, apiErrorSchema } from "@repo/api-contract";

import { findDayDetail } from "./find-day-detail.js";
import { findDaysWithStatistics } from "./find-days-with-statistics.js";

const listPath = "/days" as const satisfies ApiEndpointPath;
const detailPath = "/days/:date" as const satisfies ApiEndpointPath;

const listEndpoint = apiEndpoints[listPath];
const detailEndpoint = apiEndpoints[detailPath];

export function daysRoutes(app: FastifyInstance): void {
  const api = app.withTypeProvider<ZodTypeProvider>();

  api.get(
    listPath,
    {
      schema: {
        querystring: listEndpoint.query,
        response: { 200: listEndpoint.response },
      },
    },
    (request): Promise<DaysList> => findDaysWithStatistics(app.prisma, request.query),
  );

  api.get(
    detailPath,
    {
      schema: {
        params: detailEndpoint.params,
        response: { 200: detailEndpoint.response, 404: apiErrorSchema },
      },
    },
    async (request, reply) => {
      const { date } = request.params;
      const dayDetail = await findDayDetail(app.prisma, date);

      if (dayDetail !== null) return dayDetail;

      const body: ApiError = {
        statusCode: 404,
        code: "NOT_FOUND",
        message: `No electricity data for ${date}`,
      };

      return reply.status(404).send(body);
    },
  );
}
