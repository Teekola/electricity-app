import type { FastifyError, FastifyInstance } from "fastify";
import {
  hasZodFastifySchemaValidationErrors,
  isResponseSerializationError,
} from "fastify-type-provider-zod";

import type { ApiError, ApiErrorCode } from "@repo/api-contract";

function codeFor(statusCode: number): ApiErrorCode {
  if (statusCode === 404) return "NOT_FOUND";
  if (statusCode >= 400 && statusCode < 500) return "BAD_REQUEST";

  return "INTERNAL_ERROR";
}

/**
 * Must be called on the root instance: Fastify encapsulates these handlers per scope, so
 * a plugin's would cover only its own routes.
 */
export function registerErrorHandling(app: FastifyInstance): void {
  app.setNotFoundHandler((request, reply) => {
    const body: ApiError = {
      statusCode: 404,
      code: "NOT_FOUND",
      message: `Route ${request.method} ${request.url} not found`,
    };

    return reply.status(404).send(body);
  });

  app.setErrorHandler((error: FastifyError, request, reply) => {
    if (hasZodFastifySchemaValidationErrors(error)) {
      const body: ApiError = {
        statusCode: 400,
        code: "BAD_REQUEST",
        message: "Request did not match the API contract",
        issues: error.validation.map((issue) => ({
          path: issue.instancePath,
          message: issue.message ?? "Invalid value",
        })),
      };

      return reply.status(400).send(body);
    }

    const statusCode = isResponseSerializationError(error) ? 500 : (error.statusCode ?? 500);

    if (statusCode >= 500) {
      request.log.error({ err: error }, "Request failed");
    }

    const body: ApiError = {
      statusCode,
      code: codeFor(statusCode),
      // A 5xx message can name a table or a column; the log line above keeps it.
      message: statusCode >= 500 ? "Internal server error" : error.message,
    };

    return reply.status(statusCode).send(body);
  });
}
