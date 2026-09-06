import { describe, expect, it } from "vitest";

import { dayHref, listHref } from "./day-detail-links";
import { parseDaysQuery } from "./days-query";

const DEFAULTS = parseDaysQuery({});

const CHOSEN = {
  page: "3",
  size: "25",
  sort: "price",
  dir: "asc",
  dateFrom: "2024-01-01",
  dateTo: "2024-01-31",
  priceMax: "0",
};

describe("dayHref", () => {
  it("names the Day alone when the list carries no choices", () => {
    expect(dayHref("2024-01-15", DEFAULTS)).toBe("/days/2024-01-15");
  });

  it("carries the list's choices, so the Day can be returned from without history", () => {
    const href = dayHref("2024-01-15", parseDaysQuery(CHOSEN));

    expect(href).toBe(
      "/days/2024-01-15?page=3&size=25&sort=price&dir=asc&dateFrom=2024-01-01&dateTo=2024-01-31&priceMax=0",
    );
  });
});

describe("listHref", () => {
  it("is the bare list when the Day carries no choices", () => {
    expect(listHref({})).toBe("/");
  });

  it("restores every choice the Day was reached with", () => {
    expect(listHref(CHOSEN)).toBe(
      "/?page=3&size=25&sort=price&dir=asc&dateFrom=2024-01-01&dateTo=2024-01-31&priceMax=0",
    );
  });

  it("round-trips a Day reached from a filtered list", () => {
    const query = parseDaysQuery(CHOSEN);
    const search = dayHref("2024-01-15", query).split("?")[1];

    expect(listHref(Object.fromEntries(new URLSearchParams(search)))).toBe(`/?${search}`);
  });

  it("drops what the list would not have put in the URL itself", () => {
    expect(listHref({ page: "1", size: "50", surprise: "yes", sort: "nonsense" })).toBe("/");
  });

  it("keeps the reader's other choices when one parameter is unusable", () => {
    expect(listHref({ sort: "nonsense", dir: "asc" })).toBe("/?dir=asc");
  });
});
