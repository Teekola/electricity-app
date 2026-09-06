import { describe, expect, it } from "vitest";

import { parseDailyStatisticsQuery } from "./daily-statistics-query";
import { fromSortingState, toSortingState } from "./daily-statistics-sorting";

/** A query that shares no field with the contract's defaults, so no assertion can pass by accident. */
const CHOSEN = parseDailyStatisticsQuery({
  page: "3",
  size: "10",
  sort: "price",
  dir: "asc",
  dateFrom: "2024-01-01",
  dateTo: "2024-01-31",
});

const FILTERED = parseDailyStatisticsQuery({
  dateFrom: "2024-01-01",
  dateTo: "2024-01-31",
  prodMin: "8000",
  consMax: "500",
  priceMin: "-5",
  priceMax: "5",
  streakMin: "3",
});

describe("toSortingState", () => {
  it("names the column the rows already arrived sorted by", () => {
    expect(toSortingState(CHOSEN)).toEqual([{ id: "price", desc: false }]);
  });

  it("marks a descending sort as descending", () => {
    expect(toSortingState({ ...CHOSEN, dir: "desc" })).toEqual([{ id: "price", desc: true }]);
  });
});

describe("fromSortingState", () => {
  it("asks for the ordering a header click reports", () => {
    const query = fromSortingState([{ id: "cons", desc: true }], CHOSEN);

    expect(query).toMatchObject({ sort: "cons", dir: "desc" });
  });

  it("returns to the first page, because the ranking changed under the reader", () => {
    expect(fromSortingState([{ id: "cons", desc: true }], CHOSEN).page).toBe(1);
  });

  it("keeps the filters the reader is narrowing by", () => {
    expect(fromSortingState([{ id: "date", desc: false }], FILTERED)).toMatchObject({
      dateFrom: "2024-01-01",
      priceMin: -5,
      streakMin: 3,
    });
  });

  it("keeps the current ordering for a column outside the contract's allowlist", () => {
    expect(fromSortingState([{ id: "hoursWithData", desc: true }], CHOSEN)).toEqual(CHOSEN);
  });

  it("keeps the current ordering when the table reports no column at all", () => {
    expect(fromSortingState([], CHOSEN)).toEqual(CHOSEN);
  });

  it("is the inverse of toSortingState", () => {
    expect(fromSortingState(toSortingState(CHOSEN), CHOSEN)).toEqual({ ...CHOSEN, page: 1 });
  });
});
