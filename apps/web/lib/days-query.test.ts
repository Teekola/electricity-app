import { describe, expect, it } from "vitest";

import {
  filteredMeasures,
  hasFilters,
  measureRanges,
  parseDaysQuery,
  toSearchParams,
  withDateRange,
  withMeasureRanges,
  withoutFilters,
  withoutMeasure,
  withPageSize,
} from "./days-query";

/** A query that shares no field with the contract's defaults, so no assertion can pass by accident. */
const CHOSEN = parseDaysQuery({
  page: "3",
  size: "10",
  sort: "price",
  dir: "asc",
  dateFrom: "2024-01-01",
  dateTo: "2024-01-31",
});

const FILTERED = parseDaysQuery({
  ...{ dateFrom: "2024-01-01", dateTo: "2024-01-31" },
  prodMin: "8000",
  consMax: "500",
  priceMin: "-5",
  priceMax: "5",
  streakMin: "3",
});

describe("parseDaysQuery", () => {
  it("falls back to the contract's defaults when the URL carries nothing", () => {
    expect(parseDaysQuery({})).toEqual({
      page: 1,
      size: 50,
      sort: "date",
      dir: "desc",
    });
  });

  it("takes every choice the URL carries", () => {
    expect(CHOSEN).toEqual({
      page: 3,
      size: 10,
      sort: "price",
      dir: "asc",
      dateFrom: "2024-01-01",
      dateTo: "2024-01-31",
    });
  });

  it("takes a bound for every measure", () => {
    expect(measureRanges(FILTERED)).toEqual({
      prodMin: 8000,
      prodMax: undefined,
      consMin: undefined,
      consMax: 500,
      priceMin: -5,
      priceMax: 5,
      streakMin: 3,
      streakMax: undefined,
    });
  });

  it("drops a hand-edited sort column the API would reject, keeping the other choices", () => {
    const query = parseDaysQuery({
      sort: "hoursWithData",
      dir: "asc",
      size: "10",
      dateFrom: "2024-01-01",
    });

    expect(query).toEqual({
      page: 1,
      size: 10,
      sort: "date",
      dir: "asc",
      dateFrom: "2024-01-01",
    });
  });

  it("drops a streak of at least zero hours a URL carries, so it shows as no filter at all", () => {
    const query = parseDaysQuery({ streakMin: "0", size: "10" });

    expect(query.streakMin).toBeUndefined();
    expect(filteredMeasures(query)).toEqual([]);
    expect(hasFilters(query)).toBe(false);
    expect(query.size).toBe(10);
  });

  it("reads a blank bound a URL carries as no bound, not as zero", () => {
    const query = parseDaysQuery({ priceMin: " ", consMax: "" });

    expect(filteredMeasures(query)).toEqual([]);
    expect(hasFilters(query)).toBe(false);
  });

  it("drops a bound that is not a number, keeping the other choices", () => {
    const query = parseDaysQuery({ priceMin: "cheap", streakMin: "3", size: "10" });

    expect(query).toEqual({ page: 1, size: 10, sort: "date", dir: "desc", streakMin: 3 });
  });

  it("clamps a page size past the contract's maximum instead of dropping it", () => {
    const query = parseDaysQuery({ page: "3", size: "250" });

    expect(query).toMatchObject({ page: 3, size: 200 });
  });

  it("clamps a page size of zero to one page rather than dropping it", () => {
    expect(parseDaysQuery({ size: "0" })).toMatchObject({ size: 1 });
  });

  it("still falls back to the default page size when the URL carries nonsense", () => {
    expect(parseDaysQuery({ size: "fifty" })).toMatchObject({ size: 50 });
  });

  it("drops a repeated parameter rather than guessing which one was meant", () => {
    const query = parseDaysQuery({ dir: ["asc", "desc"], sort: "prod" });

    expect(query).toMatchObject({ sort: "prod", dir: "desc" });
  });

  it("drops both bounds of a Day range that runs backwards, and only those", () => {
    const query = parseDaysQuery({
      sort: "price",
      dir: "asc",
      size: "10",
      dateFrom: "2024-02-01",
      dateTo: "2024-01-01",
    });

    expect(query).toEqual({ page: 1, size: 10, sort: "price", dir: "asc" });
  });

  it.each([
    ["prodMin", "prodMax"],
    ["consMin", "consMax"],
    ["priceMin", "priceMax"],
    ["streakMin", "streakMax"],
  ])("drops %s and %s when that one range runs backwards, and only those", (min, max) => {
    const query = parseDaysQuery({
      [min]: "9",
      [max]: "2",
      dateFrom: "2024-01-01",
      streakMin: min === "streakMin" ? "9" : "1",
    });

    expect(query).not.toHaveProperty(min, 9);
    expect(query).not.toHaveProperty(max, 2);
    expect(query).toMatchObject({ dateFrom: "2024-01-01" });
  });
});

describe("toSearchParams", () => {
  it("reproduces the query it was given", () => {
    const params = toSearchParams(FILTERED);

    expect(parseDaysQuery(Object.fromEntries(params.entries()))).toEqual(FILTERED);
  });

  it("asks for nothing at all for the default view", () => {
    expect(toSearchParams(parseDaysQuery({})).toString()).toBe("");
  });

  it("leaves out a bound the query does not carry", () => {
    const params = toSearchParams(CHOSEN);

    expect(params.has("priceMin")).toBe(false);
    expect(params.has("streakMax")).toBe(false);
  });

  it("carries a choice that only happens to look like a default of another field", () => {
    const params = toSearchParams(parseDaysQuery({ streakMin: "1", page: "1" }));

    expect(params.get("streakMin")).toBe("1");
    expect(params.has("page")).toBe(false);
  });
});

describe("withPageSize", () => {
  it("returns to the first page, because a position means nothing at another size", () => {
    expect(withPageSize(CHOSEN, 100)).toEqual({ ...CHOSEN, page: 1, size: 100 });
  });

  it("keeps the ordering and the filters the reader chose", () => {
    expect(withPageSize(FILTERED, 25)).toMatchObject({
      dateFrom: "2024-01-01",
      priceMin: -5,
      streakMin: 3,
    });
  });
});

describe("withDateRange", () => {
  it("returns to the first page, because the list is a different list", () => {
    expect(withDateRange(CHOSEN, "2024-03-01", "2024-03-31")).toEqual({
      ...CHOSEN,
      page: 1,
      dateFrom: "2024-03-01",
      dateTo: "2024-03-31",
    });
  });

  it("takes an open-ended range", () => {
    expect(withDateRange(CHOSEN, "2024-03-01", undefined)).toMatchObject({
      dateFrom: "2024-03-01",
      dateTo: undefined,
    });
  });

  it("keeps the measure filters, which are a separate choice", () => {
    expect(withDateRange(FILTERED, undefined, undefined)).toMatchObject({
      priceMin: -5,
      streakMin: 3,
    });
  });
});

describe("withMeasureRanges", () => {
  it("replaces every bound, so a field the reader emptied stops filtering", () => {
    const query = withMeasureRanges(FILTERED, {
      ...measureRanges(FILTERED),
      priceMin: undefined,
      priceMax: undefined,
      prodMin: 1000,
    });

    expect(query).toMatchObject({ prodMin: 1000, streakMin: 3, page: 1 });
    expect(query.priceMin).toBeUndefined();
    expect(query.priceMax).toBeUndefined();
  });

  it("keeps the Day range, which is a separate choice", () => {
    const query = withMeasureRanges(FILTERED, measureRanges(CHOSEN));

    expect(query).toMatchObject({ dateFrom: "2024-01-01", dateTo: "2024-01-31" });
  });

  it("reads a streak of at least zero hours as no filter, because it excludes no Day", () => {
    const query = withMeasureRanges(CHOSEN, { ...measureRanges(CHOSEN), streakMin: 0 });

    expect(query.streakMin).toBeUndefined();
    expect(filteredMeasures(query)).toEqual([]);
  });

  it("keeps a streak maximum of zero, which asks for the Days that never went negative", () => {
    const query = withMeasureRanges(CHOSEN, { ...measureRanges(CHOSEN), streakMax: 0 });

    expect(query.streakMax).toBe(0);
    expect(filteredMeasures(query)).toEqual(["streak"]);
  });
});

describe("withoutMeasure", () => {
  it("clears both bounds of the measure, because half a range is a lie", () => {
    const query = withoutMeasure(FILTERED, "price");

    expect(query.priceMin).toBeUndefined();
    expect(query.priceMax).toBeUndefined();
    expect(query).toMatchObject({ page: 1, prodMin: 8000, streakMin: 3 });
  });

  it("leaves the Day range alone", () => {
    expect(withoutMeasure(FILTERED, "price")).toMatchObject({ dateFrom: "2024-01-01" });
  });
});

describe("withoutFilters", () => {
  it("shows every Day again, at the ordering and page size the reader chose", () => {
    const query = withoutFilters(FILTERED);

    expect(hasFilters(query)).toBe(false);
    expect(query).toMatchObject({ page: 1, size: FILTERED.size, sort: FILTERED.sort });
  });
});

describe("filteredMeasures", () => {
  it("names each measure carrying a bound, in the order the table shows them", () => {
    expect(filteredMeasures(FILTERED)).toEqual(["prod", "cons", "price", "streak"]);
  });

  it("names a measure with only one bound", () => {
    expect(filteredMeasures(parseDaysQuery({ consMax: "500" }))).toEqual(["cons"]);
  });

  it("names nothing when only the Day range is set", () => {
    expect(filteredMeasures(CHOSEN)).toEqual([]);
  });
});

describe("hasFilters", () => {
  it("is false for the default view", () => {
    expect(hasFilters(parseDaysQuery({}))).toBe(false);
  });

  it("is true for a Day range alone", () => {
    expect(hasFilters(CHOSEN)).toBe(true);
  });

  it("is true for a measure bound alone", () => {
    expect(hasFilters(parseDaysQuery({ streakMin: "1" }))).toBe(true);
  });

  it("ignores the ordering and the page, which are not filters", () => {
    expect(hasFilters(parseDaysQuery({ page: "3", sort: "price", dir: "asc" }))).toBe(false);
  });
});
