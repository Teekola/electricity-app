import Fastify, { type FastifyInstance, type FastifyServerOptions } from "fastify";
import { serializerCompiler, validatorCompiler } from "fastify-type-provider-zod";

import { healthRoutes } from "./routes/health.js";
import { type Config, loadConfig } from "./config.js";
import { registerErrorHandling } from "./errors.js";

function loggerOptions(config: Config): FastifyServerOptions["logger"] {
  if (config.LOG_LEVEL === "silent") return false;

  if (config.NODE_ENV === "production") return { level: config.LOG_LEVEL };

  return {
    level: config.LOG_LEVEL,
    transport: {
      target: "pino-pretty",
      options: { translateTime: "HH:MM:ss Z", ignore: "pid,hostname" },
    },
  };
}

/** Builds a Fastify instance without binding a port, so tests can use `app.inject()`. */
export async function buildApp(config: Config = loadConfig()): Promise<FastifyInstance> {
  const app = Fastify({ logger: loggerOptions(config) });

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  registerErrorHandling(app);

  await app.register(healthRoutes);

  return app;
}
