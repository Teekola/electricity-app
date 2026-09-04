import { describe, expect, it } from "vitest";

import { environmentSchema } from "./env";

describe("environmentSchema", () => {
  it("refuses to start without an API to call", () => {
    expect(environmentSchema.safeParse({}).success).toBe(false);
  });
});
