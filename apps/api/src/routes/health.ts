import type { FastifyInstance } from "fastify";

/**
 * Liveness only. Touching the database here would let a brief database outage fail the
 * load balancer's health check, which replaces tasks, turning a blip into a restart loop.
 */
export function healthRoutes(app: FastifyInstance): void {
  app.get(
    "/health",
    {
      schema: {
        response: {
          200: {
            type: "object",
            properties: { status: { type: "string" } },
            required: ["status"],
          },
        },
      },
    },
    () => ({ status: "ok" }),
  );
}
