import type { Metadata } from "next";
import { Suspense } from "react";

import { daysQuerySchema, isoDateSchema } from "@repo/api-contract";

import {
  DayBreadcrumb,
  DayDetailBody,
  DayDetailBodyFallback,
  DayHeading,
} from "@/components/day-detail";
import { PageHeader } from "@/components/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { getDaysWithStatistics } from "@/lib/days";
import { formatDayDetailTitle } from "@/lib/format";

const PRERENDERED_DAYS = 15;

export async function generateStaticParams(): Promise<{ date: string }[]> {
  const { dailyStatistics } = await getDaysWithStatistics(daysQuerySchema.parse({}));

  return dailyStatistics.slice(0, PRERENDERED_DAYS).map(({ date }) => ({ date }));
}

export async function generateMetadata({ params }: PageProps<"/days/[date]">): Promise<Metadata> {
  const day = isoDateSchema.safeParse((await params).date);

  return { title: day.success ? formatDayDetailTitle(day.data) : "Electricity data" };
}

export default function Page({ params }: PageProps<"/days/[date]">) {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 md:px-8">
      <PageHeader
        breadcrumb={
          <Suspense fallback={<Skeleton className="h-4 w-40" />}>
            <DayBreadcrumb params={params} />
          </Suspense>
        }
        heading={
          <Suspense fallback={<Skeleton className="h-9 w-80" />}>
            <DayHeading params={params} />
          </Suspense>
        }
      />
      <Suspense fallback={<DayDetailBodyFallback />}>
        <DayDetailBody params={params} />
      </Suspense>
    </main>
  );
}
