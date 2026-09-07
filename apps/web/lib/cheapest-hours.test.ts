import { describe, expect, it } from "vitest";

import { rankCheapestHours } from "./cheapest-hours";

describe("rankCheapestHours", () => {
  it("numbers hours of different prices in order", () => {
    expect(
      rankCheapestHours([
        { hour: "00:00", priceCentsPerKwh: 0.956 },
        { hour: "04:00", priceCentsPerKwh: 1.629 },
        { hour: "05:00", priceCentsPerKwh: 1.674 },
      ]).map(({ rank }) => rank),
    ).toEqual([1, 2, 3]);
  });

  it("gives hours the dataset prices the same one rank, since neither is cheaper", () => {
    expect(
      rankCheapestHours([
        { hour: "00:00", priceCentsPerKwh: 0 },
        { hour: "03:00", priceCentsPerKwh: 0 },
        { hour: "04:00", priceCentsPerKwh: 0 },
        { hour: "01:00", priceCentsPerKwh: 0.001 },
      ]).map(({ rank }) => rank),
    ).toEqual([1, 1, 1, 2]);
  });

  it("ranks nothing when the Day priced nothing", () => {
    expect(rankCheapestHours([])).toEqual([]);
  });
});
