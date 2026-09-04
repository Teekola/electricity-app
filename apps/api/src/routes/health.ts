import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";

import type { Health } from "@repo/api-contract";
import { apiEndpoints } from "@repo/api-contract";

const path = "/health";

/**
 * Liveness only. Touching the database here would let a brief database outage fail the
 * load balancer's health check, which replaces tasks, turning a blip into a restart loop.
 */
export function healthRoutes(app: FastifyInstance): void {
  app.withTypeProvider<ZodTypeProvider>().get(
    path,
    {
      schema: {
        response: { 200: apiEndpoints[path].response },
      },
    },
    (): Health => ({ status: "ok" }),
  );
}
