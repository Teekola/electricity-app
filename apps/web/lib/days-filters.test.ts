import { describe, expect, it } from "vitest";

import { describeDateRange, describeMeasureFilter } from "./days-filters";
import { parseDaysQuery } from "./days-query";

const query = (searchParams: Record<string, string>) => parseDaysQuery(searchParams);

describe("describeMeasureFilter", () => {
  it("names both bounds and the unit they are in", () => {
    expect(describeMeasureFilter(query({ priceMin: "-5", priceMax: "5" }), "price")).toBe(
      "Average price -5.00 to 5.00 c/kWh",
    );
  });

  it("says which side a single bound is", () => {
    expect(describeMeasureFilter(query({ prodMin: "8000" }), "prod")).toBe(
      "Production at least 8,000 MWh",
    );
    expect(describeMeasureFilter(query({ consMax: "500" }), "cons")).toBe(
      "Consumption at most 500 MWh",
    );
  });

  it("counts a streak in hours", () => {
    expect(describeMeasureFilter(query({ streakMin: "3" }), "streak")).toBe(
      "Negative streak at least 3 h",
    );
  });

  it("names the measure alone when it carries no bound", () => {
    expect(describeMeasureFilter(query({}), "price")).toBe("Average price");
  });
});

describe("describeDateRange", () => {
  it("reads as a span when both ends are set", () => {
    expect(describeDateRange(query({ dateFrom: "2024-01-01", dateTo: "2024-01-31" }))).toBe(
      "01 Jan 2024 – 31 Jan 2024",
    );
  });

  it("reads as open-ended when one end is set", () => {
    expect(describeDateRange(query({ dateFrom: "2023-08-01" }))).toBe("From 01 Aug 2023");
    expect(describeDateRange(query({ dateTo: "2024-09-29" }))).toBe("Until 29 Sep 2024");
  });

  it("says every Day is shown when neither end is set", () => {
    expect(describeDateRange(query({}))).toBe("All days");
  });
});
