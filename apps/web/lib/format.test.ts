import { describe, expect, it } from "vitest";

import { formatDay, formatMwh, formatPrice, formatStreak } from "./format";

describe("formatMwh", () => {
  it("groups thousands and drops the decimals, which are noise at this magnitude", () => {
    expect(formatMwh(719282.09)).toBe("719,282");
  });

  it("renders an unmeasured value as an em dash, never as zero", () => {
    expect(formatMwh(null)).toBe("—");
  });

  it("keeps a genuine zero distinct from an unmeasured value", () => {
    expect(formatMwh(0)).toBe("0");
  });
});

describe("formatPrice", () => {
  it("keeps two decimals, because the price moves in cents", () => {
    expect(formatPrice(5.830190476190476)).toBe("5.83");
  });

  it("keeps the sign on a negative price", () => {
    expect(formatPrice(-0.4603333333333333)).toBe("-0.46");
  });

  it("renders an unmeasured price as an em dash", () => {
    expect(formatPrice(null)).toBe("—");
  });
});

describe("formatStreak", () => {
  it("renders no streak as an en dash, so the column reads as empty rather than measured", () => {
    expect(formatStreak(0)).toBe("–");
  });

  it("counts a single hour", () => {
    expect(formatStreak(1)).toBe("1 h");
  });

  it("counts a whole Day", () => {
    expect(formatStreak(24)).toBe("24 h");
  });
});

describe("formatDay", () => {
  it("spells the month out, so no reader has to guess the field order", () => {
    expect(formatDay("2024-10-01")).toBe("01 Oct 2024");
  });

  it("formats the date as given, without shifting it into the reader's zone", () => {
    expect(formatDay("2021-01-01")).toBe("01 Jan 2021");
  });
});
