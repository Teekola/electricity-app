import { describe, expect, it } from "vitest";

import { paginationItems } from "./pagination-items";

/** 1,371 days at the default page size of 50. */
const TOTAL_PAGES = 28;

describe("paginationItems", () => {
  it("lists every page of a run short enough to fit", () => {
    expect(paginationItems(3, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it("lists nothing when no day matches the filter", () => {
    expect(paginationItems(1, 0)).toEqual([]);
  });

  it("elides only the tail near the first page", () => {
    expect(paginationItems(1, TOTAL_PAGES)).toEqual([1, 2, 3, 4, 5, "ellipsis", 28]);
  });

  it("elides only the head near the last page", () => {
    expect(paginationItems(28, TOTAL_PAGES)).toEqual([1, "ellipsis", 24, 25, 26, 27, 28]);
  });

  it("keeps a sibling either side of a page in the middle", () => {
    expect(paginationItems(14, TOTAL_PAGES)).toEqual([1, "ellipsis", 13, 14, 15, "ellipsis", 28]);
  });

  it("holds one width across every page of the run", () => {
    const widths = new Set(
      Array.from(
        { length: TOTAL_PAGES },
        (_, page) => paginationItems(page + 1, TOTAL_PAGES).length,
      ),
    );

    expect(widths).toEqual(new Set([SLOTS]));
  });

  it("always includes the current page", () => {
    for (let page = 1; page <= TOTAL_PAGES; page++) {
      expect(paginationItems(page, TOTAL_PAGES)).toContain(page);
    }
  });

  it("clamps a hand-edited page beyond the end rather than linking to it", () => {
    expect(paginationItems(999, TOTAL_PAGES)).toEqual([1, "ellipsis", 24, 25, 26, 27, 28]);
  });
});

const SLOTS = 7;
