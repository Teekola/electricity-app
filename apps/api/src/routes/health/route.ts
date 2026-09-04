import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";

import type { ApiEndpointPath, Health } from "@repo/api-contract";
import { apiEndpoints } from "@repo/api-contract";

const path = "/health" as const satisfies ApiEndpointPath;
const endpoint = apiEndpoints[path];

export function healthRoutes(app: FastifyInstance): void {
  app.withTypeProvider<ZodTypeProvider>().get(
    path,
    {
      schema: {
        response: { 200: endpoint.response },
      },
    },
    (): Health => ({ status: "ok" }),
  );
}
