"use client";

import type { MouseEvent } from "react";

import type { Pagination as PaginationMeta } from "@repo/api-contract";

import { useDailyStatisticsNavigation } from "@/components/daily-statistics-navigation";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { toSearchParams } from "@/lib/daily-statistics-query";
import { paginationItems } from "@/lib/pagination-items";

export interface DailyStatisticsPaginationProps {
  readonly pagination: PaginationMeta;
}

export function DailyStatisticsPagination({ pagination }: DailyStatisticsPaginationProps) {
  const { totalPages } = pagination;
  const { query, goTo } = useDailyStatisticsNavigation();
  const page = query.page;

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
