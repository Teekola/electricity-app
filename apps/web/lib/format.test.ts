import { describe, expect, it } from "vitest";

import {
  formatDay,
  formatHourlyPrice,
  formatMwh,
  formatPercent,
  formatPrice,
  formatStreak,
} from "./format";

describe("formatHourlyPrice", () => {
  it("keeps the source's three decimals, so hours that differ do not read as equal", () => {
    expect(formatHourlyPrice(0)).toBe("0.000");
    expect(formatHourlyPrice(0.001)).toBe("0.001");
  });

  it("renders an unpriced hour as an em dash", () => {
    expect(formatHourlyPrice(null)).toBe("—");
  });
});

describe("formatPercent", () => {
  it("reads a ratio as the percentage a reader compares hours by", () => {
    expect(formatPercent(0.159829)).toBe("16.0%");
  });

  it("keeps one decimal, because the Days differ by less than a whole percent", () => {
    expect(formatPercent(0.131716)).toBe("13.2%");
  });

  it("renders an unmeasured ratio as an em dash", () => {
    expect(formatPercent(null)).toBe("—");
  });
});

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
  it("counts a Day with no negative hours as zero, which is measured, not missing", () => {
    expect(formatStreak(0)).toBe("0 h");
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
