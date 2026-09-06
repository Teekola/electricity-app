"use client";

import type { MouseEvent } from "react";

import type { Pagination as PaginationMeta } from "@repo/api-contract";

import { useDaysNavigation } from "@/components/days-navigation";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { toSearchParams } from "@/lib/days-query";
import { paginationItems } from "@/lib/pagination-items";

export interface DaysPaginationProps {
  readonly pagination: PaginationMeta;
}

export function DaysPagination({ pagination }: DaysPaginationProps) {
  const { totalPages } = pagination;
  const { isNavigating, query, goTo } = useDaysNavigation();
  // A URL can ask for a page past the end, which the API clamps: mid-navigation the reader's
  // own choice is what to show, and once the rows land it is the page they actually came from.
  const page = isNavigating ? query.page : pagination.page;

  if (totalPages <= 1) return null;

  const pageHref = (target: number) => `?${toSearchParams({ ...query, page: target }).toString()}`;

  const goToPage = (target: number) => (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    event.preventDefault();
    goTo({ ...query, page: target });
  };

  return (
    <Pagination className="mx-0 w-auto justify-end">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href={page > 1 ? pageHref(page - 1) : undefined}
            onClick={goToPage(page - 1)}
          />
        </PaginationItem>
        <PaginationItem className="px-2 text-xs whitespace-nowrap text-muted-foreground sm:hidden">
          Page {page} of {totalPages}
        </PaginationItem>
        {paginationItems(page, totalPages).map((item, index) => (
          <PaginationItem
            key={item === "ellipsis" ? `ellipsis-${index}` : item}
            className="hidden sm:block"
          >
            {item === "ellipsis" ? (
              <PaginationEllipsis />
            ) : (
              <PaginationLink
                href={pageHref(item)}
                isActive={item === page}
                aria-label={`Go to page ${item}`}
                onClick={goToPage(item)}
                className={item === page ? "font-medium text-foreground" : "text-muted-foreground"}
              >
                {item}
              </PaginationLink>
            )}
          </PaginationItem>
        ))}
        <PaginationItem>
          <PaginationNext
            href={page < totalPages ? pageHref(page + 1) : undefined}
            onClick={goToPage(page + 1)}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
