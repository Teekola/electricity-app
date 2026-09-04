import { describe, expect, it } from "vitest";

import {
  fromSortingState,
  parseDailyStatisticsQuery,
  toSearchParams,
  toSortingState,
} from "./daily-statistics-query";

/** A query that shares no field with the contract's defaults, so no assertion can pass by accident. */
const CHOSEN = parseDailyStatisticsQuery({
  page: "3",
  pageSize: "10",
  sortBy: "averagePriceCentsPerKwh",
  sortDirection: "asc",
  dateFrom: "2024-01-01",
  dateTo: "2024-01-31",
});

describe("parseDailyStatisticsQuery", () => {
  it("falls back to the contract's defaults when the URL carries nothing", () => {
    expect(parseDailyStatisticsQuery({})).toEqual({
      page: 1,
      pageSize: 50,
      sortBy: "date",
      sortDirection: "desc",
    });
  });

  it("takes every choice the URL carries", () => {
    expect(CHOSEN).toEqual({
      page: 3,
      pageSize: 10,
      sortBy: "averagePriceCentsPerKwh",
      sortDirection: "asc",
      dateFrom: "2024-01-01",
      dateTo: "2024-01-31",
    });
  });

  it("drops a hand-edited sort column the API would reject, keeping the other choices", () => {
    const query = parseDailyStatisticsQuery({
      sortBy: "hoursWithData",
      sortDirection: "asc",
      pageSize: "10",
      dateFrom: "2024-01-01",
    });

    expect(query).toEqual({
      page: 1,
      pageSize: 10,
      sortBy: "date",
      sortDirection: "asc",
      dateFrom: "2024-01-01",
    });
  });

  it("drops a repeated parameter rather than guessing which one was meant", () => {
    const query = parseDailyStatisticsQuery({
      sortDirection: ["asc", "desc"],
      sortBy: "totalProductionMwh",
    });

    expect(query).toMatchObject({ sortBy: "totalProductionMwh", sortDirection: "desc" });
  });

  it("drops both bounds of a range that runs backwards, and only those", () => {
    const query = parseDailyStatisticsQuery({
      sortBy: "averagePriceCentsPerKwh",
      sortDirection: "asc",
      pageSize: "10",
      dateFrom: "2024-02-01",
      dateTo: "2024-01-01",
    });

    expect(query).toEqual({
      page: 1,
      pageSize: 10,
      sortBy: "averagePriceCentsPerKwh",
      sortDirection: "asc",
    });
  });
});

describe("toSearchParams", () => {
  it("reproduces the query it was given", () => {
    const params = toSearchParams(CHOSEN);

    expect(parseDailyStatisticsQuery(Object.fromEntries(params.entries()))).toEqual(CHOSEN);
  });

  it("leaves out a bound the query does not carry", () => {
    const params = toSearchParams(parseDailyStatisticsQuery({}));

    expect(params.has("dateFrom")).toBe(false);
    expect(params.has("dateTo")).toBe(false);
  });
});

describe("toSortingState", () => {
  it("names the column the rows already arrived sorted by", () => {
    expect(toSortingState(CHOSEN)).toEqual([{ id: "averagePriceCentsPerKwh", desc: false }]);
  });

  it("marks a descending sort as descending", () => {
    expect(toSortingState({ ...CHOSEN, sortDirection: "desc" })).toEqual([
      { id: "averagePriceCentsPerKwh", desc: true },
    ]);
  });
});

describe("fromSortingState", () => {
  it("asks for the ordering a header click reports", () => {
    const query = fromSortingState([{ id: "totalConsumptionMwh", desc: true }], CHOSEN);

    expect(query).toMatchObject({ sortBy: "totalConsumptionMwh", sortDirection: "desc" });
  });

  it("returns to the first page, because the ranking changed under the reader", () => {
    const query = fromSortingState([{ id: "totalConsumptionMwh", desc: true }], CHOSEN);

    expect(query.page).toBe(1);
  });

  it("keeps the date range the reader is filtering by", () => {
    const query = fromSortingState([{ id: "date", desc: false }], CHOSEN);

    expect(query).toMatchObject({ dateFrom: "2024-01-01", dateTo: "2024-01-31" });
  });

  it("keeps the current ordering for a column outside the contract's allowlist", () => {
    const query = fromSortingState([{ id: "hoursWithData", desc: true }], CHOSEN);

    expect(query).toEqual(CHOSEN);
  });

  it("keeps the current ordering when the table reports no column at all", () => {
    expect(fromSortingState([], CHOSEN)).toEqual(CHOSEN);
  });

  it("is the inverse of toSortingState", () => {
    expect(fromSortingState(toSortingState(CHOSEN), CHOSEN)).toEqual({ ...CHOSEN, page: 1 });
  });
});
