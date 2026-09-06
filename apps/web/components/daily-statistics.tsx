import { type ReactNode, Suspense } from "react";

import type {
  DailyStatistics,
  DailyStatisticsQuery,
  IsoDate,
  Pagination,
} from "@repo/api-contract";

import { DailyStatisticsFilters } from "@/components/daily-statistics-filters";
import { DailyStatisticsNavigationProvider } from "@/components/daily-statistics-navigation";
import { DailyStatisticsPageSize } from "@/components/daily-statistics-page-size";
import { DailyStatisticsPagination } from "@/components/daily-statistics-pagination";
import {
  DailyStatisticsTable,
  DailyStatisticsTableSkeleton,
} from "@/components/daily-statistics-table";
import { getDailyStatistics } from "@/lib/daily-statistics";
import { describeExcludedDays } from "@/lib/daily-statistics-filters";
import {
  filteredMeasures,
  hasFilters,
  parseDailyStatisticsQuery,
  type SearchParams,
} from "@/lib/daily-statistics-query";

export interface DailyStatisticsProps {
  readonly searchParams: Promise<SearchParams>;
}

export async function DailyStatistics({ searchParams }: DailyStatisticsProps) {
  const query = parseDailyStatisticsQuery(await searchParams);

  return (
    <DailyStatisticsNavigationProvider query={query}>
      <DailyStatisticsLayout>
        <Suspense fallback={<DailyStatisticsPlaceholder size={query.size} />}>
          <DailyStatisticsContent query={query} />
        </Suspense>
      </DailyStatisticsLayout>
    </DailyStatisticsNavigationProvider>
  );
}

export function DailyStatisticsFallback() {
  return (
    <DailyStatisticsLayout>
      <DailyStatisticsPlaceholder />
    </DailyStatisticsLayout>
  );
}

function DailyStatisticsLayout({ children }: { readonly children: ReactNode }) {
  return <section className="flex min-h-0 flex-1 flex-col gap-3">{children}</section>;
}

function DailyStatisticsPlaceholder({ size }: { readonly size?: number }) {
  return (
    <>
      {/* Holds the filter bar's height, so the controls do not shift down as the rows land. */}
      <div className="min-h-9 shrink-0" />
      <DailyStatisticsTableSkeleton size={size} />
    </>
  );
}

async function DailyStatisticsContent({ query }: { readonly query: DailyStatisticsQuery }) {
  const { dailyStatistics, pagination } = await getDailyStatistics(query);

  return (
    <>
      <DailyStatisticsFilters knownDay={latestOnPage(dailyStatistics)} />

      <DailyStatisticsTable dailyStatistics={dailyStatistics} />

      <div className="flex min-h-9 shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <DailyStatisticsSummary
          query={query}
          pagination={pagination}
          shown={dailyStatistics.length}
        />
        <div className="flex items-center gap-2">
          <DailyStatisticsPageSize />
          <DailyStatisticsPagination pagination={pagination} />
        </div>
      </div>
    </>
  );
}

function latestOnPage(dailyStatistics: readonly DailyStatistics[]): IsoDate | undefined {
  return dailyStatistics.reduce<IsoDate | undefined>(
    (latest, { date }) => (latest === undefined || date > latest ? date : latest),
    undefined,
  );
}

function DailyStatisticsSummary({
  query,
  pagination,
  shown,
}: {
  readonly query: DailyStatisticsQuery;
  readonly pagination: Pagination;
  readonly shown: number;
}) {
  const firstOnPage = (pagination.page - 1) * pagination.pageSize + 1;
  const excluded = describeExcludedDays(filteredMeasures(query));

  return (
    <div>
      {/* An empty result is announced in the table, which is where the reader is looking. */}
      {pagination.totalDays > 0 && (
        <p className="text-sm text-muted-foreground">
          {`Showing days ${firstOnPage}–${firstOnPage + shown - 1} of ${pagination.totalDays}`}
          {hasFilters(query) ? " matching days." : "."}
        </p>
      )}
      {excluded !== null && <p className="text-xs text-muted-foreground">{excluded}</p>}
    </div>
  );
}
