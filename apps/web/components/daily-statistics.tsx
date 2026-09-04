import type { ReactNode } from "react";

import { DailyStatisticsNavigationProvider } from "@/components/daily-statistics-navigation";
import { DailyStatisticsPageSize } from "@/components/daily-statistics-page-size";
import { DailyStatisticsPagination } from "@/components/daily-statistics-pagination";
import {
  DailyStatisticsTable,
  DailyStatisticsTableSkeleton,
} from "@/components/daily-statistics-table";
import { getDailyStatistics } from "@/lib/daily-statistics";
import { parseDailyStatisticsQuery, type SearchParams } from "@/lib/daily-statistics-query";

export interface DailyStatisticsProps {
  readonly searchParams: Promise<SearchParams>;
}

export async function DailyStatistics({ searchParams }: DailyStatisticsProps) {
  const query = parseDailyStatisticsQuery(await searchParams);
  const { dailyStatistics, pagination } = await getDailyStatistics(query);

  const firstOnPage = (pagination.page - 1) * pagination.pageSize + 1;
  const lastOnPage = firstOnPage + dailyStatistics.length - 1;

  return (
    <DailyStatisticsNavigationProvider query={{ ...query, page: pagination.page }}>
      <DailyStatisticsLayout
        footer={
          <div className="flex min-h-9 shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <p className="text-sm text-muted-foreground">
              {pagination.totalDays === 0
                ? "No days to show."
                : `Showing days ${firstOnPage}–${lastOnPage} of ${pagination.totalDays}.`}
            </p>
            <div className="flex items-center gap-2">
              <DailyStatisticsPageSize />
              <DailyStatisticsPagination pagination={pagination} />
            </div>
          </div>
        }
      >
        <DailyStatisticsTable dailyStatistics={dailyStatistics} />
      </DailyStatisticsLayout>
    </DailyStatisticsNavigationProvider>
  );
}

export function DailyStatisticsFallback() {
  return (
    <DailyStatisticsLayout footer={null}>
      <DailyStatisticsTableSkeleton />
    </DailyStatisticsLayout>
  );
}

function DailyStatisticsLayout({
  children,
  footer,
}: {
  readonly children: ReactNode;
  readonly footer: ReactNode;
}) {
  return (
    <section className="flex min-h-0 flex-1 flex-col gap-3">
      {children}

      {footer}
    </section>
  );
}
