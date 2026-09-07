import type { CheapestHour } from "@repo/api-contract";

export interface RankedCheapestHour extends CheapestHour {
  readonly rank: number;
}

/**
 * Hours the dataset prices identically share a rank: the list ranks prices, not hours, and
 * numbering tied hours 1, 2, 3 would claim an order the data does not hold.
 */
export function rankCheapestHours(
  cheapestHours: readonly CheapestHour[],
): readonly RankedCheapestHour[] {
  let rank = 0;
  let previousPrice: number | undefined;

  return cheapestHours.map((cheapestHour) => {
    if (cheapestHour.priceCentsPerKwh !== previousPrice) {
      rank += 1;
      previousPrice = cheapestHour.priceCentsPerKwh;
    }

    return { ...cheapestHour, rank };
  });
}
