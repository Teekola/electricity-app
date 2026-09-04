import * as z from "zod";

export const environmentSchema = z.object({
  NEXT_PUBLIC_API_BASE_URL: z.url(),
});

const result = environmentSchema.safeParse(process.env);

if (!result.success) {
  throw new Error(`Invalid environment:\n${z.prettifyError(result.error)}`);
}

/** Parsed once at import. `next.config.ts` imports this, so a bad environment fails the build. */
export const env = result.data;
