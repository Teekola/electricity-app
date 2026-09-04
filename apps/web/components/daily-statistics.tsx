import type { ReactNode } from "react";

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
    <DailyStatisticsLayout
      footer={
        <p className="text-sm text-muted-foreground">
          Showing days {firstOnPage}–{lastOnPage} of {pagination.totalDays}.
        </p>
      }
    >
      <DailyStatisticsTable dailyStatistics={dailyStatistics} query={query} />
    </DailyStatisticsLayout>
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
      <div className="flex h-9 shrink-0 items-center justify-between">{footer}</div>
    </section>
  );
}
