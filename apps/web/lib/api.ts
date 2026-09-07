import type * as z from "zod";

import type {
  ApiEndpointPath,
  ApiError,
  ApiParams,
  ApiQuery,
  ApiResponse,
} from "@repo/api-contract";
import { apiEndpoints, apiErrorSchema } from "@repo/api-contract";

import { env } from "./env";

/** A non-2xx response. `apiError` is absent when the body was not the contract's error shape. */
export class ApiResponseError extends Error {
  readonly status: number;

  constructor({
    path,
    status,
    apiError,
  }: {
    readonly path: string;
    readonly status: number;
    readonly apiError?: ApiError;
  }) {
    super(apiError?.message ?? `Request to ${path} failed with status ${status}`);
    this.name = "ApiResponseError";
    this.status = status;
  }
}

/** A 2xx body the contract does not describe: the two sides have drifted apart. */
export class ApiContractError extends Error {
  constructor(
    readonly path: string,
    readonly issues: z.core.$ZodIssue[],
  ) {
    super(`Response from ${path} did not match the API contract`);
    this.name = "ApiContractError";
  }
}

function toSearchParams(query: Record<string, unknown>): string {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      params.set(key, String(value));
    }
  }

  return params.toString();
}

/** Fills a declared path's `:param` placeholders. An unfilled one is a bug, not a request. */
function toPathname(path: string, params: Record<string, unknown>): string {
  return path.replace(/:(\w+)/g, (_, name: string) => {
    const value = params[name];

    if (typeof value !== "string" && typeof value !== "number") {
      throw new Error(`Request to ${path} needs a ${name} parameter`);
    }

    return encodeURIComponent(String(value));
  });
}

export interface ApiRequest<P extends ApiEndpointPath> {
  readonly params?: ApiParams<P>;
  readonly query?: ApiQuery<P>;
}

/** Parses the response against the schema `apiEndpoints` pairs with `path`. */
export async function fetchFromApi<P extends ApiEndpointPath>(
  path: P,
  { params, query }: ApiRequest<P> = {},
): Promise<ApiResponse<P>> {
  const { response: responseSchema } = apiEndpoints[path];

  const url = new URL(toPathname(path, params ?? {}), env.NEXT_PUBLIC_API_BASE_URL);
  url.search = toSearchParams(query ?? {});

  const response = await fetch(url);

  if (!response.ok) {
    const body: unknown = await response.json().catch(() => undefined);

    throw new ApiResponseError({
      path,
      status: response.status,
      apiError: apiErrorSchema.safeParse(body).data,
    });
  }

  const result = responseSchema.safeParse(await response.json());

  if (!result.success) {
    throw new ApiContractError(path, result.error.issues);
  }

  // A keyed lookup cannot narrow `P`, so TypeScript sees a union of every endpoint's
  // response here. The registry is what pairs the schema with the path.
  return result.data as ApiResponse<P>;
}
