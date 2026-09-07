import { describe, expect, it } from "vitest";

import { joinWithAnd } from "./list-phrase";

describe("joinWithAnd", () => {
  it("leaves one item alone", () => {
    expect(joinWithAnd(["05:00"])).toBe("05:00");
  });

  it("joins two with and, not a comma", () => {
    expect(joinWithAnd(["05:00", "06:00"])).toBe("05:00 and 06:00");
  });

  it("commas all but the last, which takes the and", () => {
    expect(joinWithAnd(["a", "b", "c"])).toBe("a, b and c");
  });

  it("has nothing to say about nothing", () => {
    expect(joinWithAnd([])).toBe("");
  });
});
