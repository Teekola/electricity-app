import type { FastifyInstance } from "fastify";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { apiErrorSchema } from "@repo/api-contract";

import { buildApp } from "./app.js";
import { loadConfig } from "./config.js";

describe("error responses", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp(loadConfig({ NODE_ENV: "test", LOG_LEVEL: "silent" }));
  });

  afterAll(async () => {
    await app.close();
  });

  it("answers an unknown route in the contract's error shape", async () => {
    const response = await app.inject({ method: "GET", url: "/nope" });

    expect(response.statusCode).toBe(404);
    expect(apiErrorSchema.parse(response.json())).toMatchObject({
      statusCode: 404,
      code: "NOT_FOUND",
    });
  });
});
