/** A page number to link, or a gap the pager elides. */
export type PaginationItem = number | "ellipsis";

const SIBLINGS = 1;
const SLOTS = 5 + 2 * SIBLINGS;

export function paginationItems(page: number, totalPages: number): PaginationItem[] {
  if (totalPages <= SLOTS) return pageRange(1, totalPages);

  const current = Math.min(Math.max(page, 1), totalPages);

  if (current <= SLOTS - 3) return [...pageRange(1, SLOTS - 2), "ellipsis", totalPages];

  if (current >= totalPages - (SLOTS - 4)) {
    return [1, "ellipsis", ...pageRange(totalPages - (SLOTS - 3), totalPages)];
  }

  return [
    1,
    "ellipsis",
    ...pageRange(current - SIBLINGS, current + SIBLINGS),
    "ellipsis",
    totalPages,
  ];
}

function pageRange(from: number, to: number): number[] {
  return Array.from({ length: Math.max(to - from + 1, 0) }, (_, offset) => from + offset);
}
