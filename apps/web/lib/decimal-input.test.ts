import { describe, expect, it } from "vitest";

import { sanitizeDecimalInput } from "./decimal-input";

describe("sanitizeDecimalInput", () => {
  it("keeps a plain number", () => {
    expect(sanitizeDecimalInput("1234")).toBe("1234");
    expect(sanitizeDecimalInput("12.34")).toBe("12.34");
  });

  it("normalizes a comma to a dot", () => {
    expect(sanitizeDecimalInput("12,34")).toBe("12.34");
  });

  it("keeps only one decimal point", () => {
    expect(sanitizeDecimalInput("1.2.3")).toBe("1.23");
    expect(sanitizeDecimalInput("1,2,3")).toBe("1.23");
  });

  it("strips everything that is not part of a number", () => {
    expect(sanitizeDecimalInput("1a2 b3€")).toBe("123");
    expect(sanitizeDecimalInput("cheap")).toBe("");
  });

  it("keeps a leading minus, because an average price goes below zero", () => {
    expect(sanitizeDecimalInput("-50")).toBe("-50");
    expect(sanitizeDecimalInput("-1.5")).toBe("-1.5");
  });

  it("takes a minus on its own, so it can be typed before the digits", () => {
    expect(sanitizeDecimalInput("-")).toBe("-");
  });

  it("drops a minus that is not leading", () => {
    expect(sanitizeDecimalInput("5-")).toBe("5");
    expect(sanitizeDecimalInput("1-2")).toBe("12");
    expect(sanitizeDecimalInput("--5")).toBe("-5");
  });

  it("truncates to the decimals the measure has", () => {
    expect(sanitizeDecimalInput("1.239", 2)).toBe("1.23");
    expect(sanitizeDecimalInput("1.2", 2)).toBe("1.2");
  });

  it("refuses a decimal point at all for a whole-numbered measure", () => {
    expect(sanitizeDecimalInput("3.5", 0)).toBe("3");
    expect(sanitizeDecimalInput("3.", 0)).toBe("3");
  });

  it("leaves an empty field empty", () => {
    expect(sanitizeDecimalInput("")).toBe("");
  });
});
