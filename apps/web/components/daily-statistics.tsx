import { type ReactNode, Suspense } from "react";

import type { DailyStatistics, DaysQuery, IsoDate, Pagination } from "@repo/api-contract";

import {
  DailyStatisticsTable,
  DailyStatisticsTableSkeleton,
} from "@/components/daily-statistics-table";
import { DaysFilters, DaysFiltersSkeleton } from "@/components/days-filters";
import { DaysNavigationProvider } from "@/components/days-navigation";
import { DaysPageSize } from "@/components/days-page-size";
import { DaysPagination } from "@/components/days-pagination";
import { getDaysWithStatistics } from "@/lib/days";
import { describeExcludedDays } from "@/lib/days-filters";
import { filteredMeasures, hasFilters, parseDaysQuery, type SearchParams } from "@/lib/days-query";

export interface DailyStatisticsProps {
  readonly searchParams: Promise<SearchParams>;
}

export async function DailyStatistics({ searchParams }: DailyStatisticsProps) {
  const query = parseDaysQuery(await searchParams);

  return (
    <DaysNavigationProvider query={query}>
      <DailyStatisticsLayout>
        <Suspense fallback={<DailyStatisticsPlaceholder size={query.size} />}>
          <DailyStatisticsContent query={query} />
        </Suspense>
      </DailyStatisticsLayout>
    </DaysNavigationProvider>
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
      <DaysFiltersSkeleton />
      <DailyStatisticsTableSkeleton size={size} />
      <div className="min-h-9 shrink-0" />
    </>
  );
}

async function DailyStatisticsContent({ query }: { readonly query: DaysQuery }) {
  const { dailyStatistics, pagination } = await getDaysWithStatistics(query);

  return (
    <>
      <DaysFilters knownDay={latestOnPage(dailyStatistics)} />

      <DailyStatisticsTable dailyStatistics={dailyStatistics} />

      <div className="flex min-h-9 shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <DailyStatisticsSummary
          query={query}
          pagination={pagination}
          shown={dailyStatistics.length}
        />
        <div className="flex items-center gap-2">
          <DaysPageSize />
          <DaysPagination pagination={pagination} />
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
  readonly query: DaysQuery;
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
