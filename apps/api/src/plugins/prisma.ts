import { PrismaPg } from "@prisma/adapter-pg";
import type { FastifyPluginCallback } from "fastify";
import fp from "fastify-plugin";

import type { Config } from "../config.js";
import { PrismaClient } from "../generated/prisma/client.js";

declare module "fastify" {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}

export interface PrismaPluginOptions {
  readonly config: Config;
}

const prismaPlugin: FastifyPluginCallback<PrismaPluginOptions> = fp<PrismaPluginOptions>(
  (server, options) => {
    const prisma = new PrismaClient({
      adapter: new PrismaPg({ connectionString: options.config.DATABASE_URL }),
    });
    prisma.$connect().catch((error: unknown) => {
      server.log.warn({ err: error }, "Could not pre-warm the database pool");
    });
    server.decorate("prisma", prisma);
    server.addHook("onClose", async (instance) => {
      await instance.prisma.$disconnect();
    });
  },
);

export default prismaPlugin;
