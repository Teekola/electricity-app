import type { Metadata } from "next";
import { Suspense } from "react";

import { daysQuerySchema, isoDateSchema } from "@repo/api-contract";

import { DayDetailBody, DayDetailBodyFallback } from "@/components/day-detail";
import { DayBreadcrumb, DayHeading } from "@/components/day-header";
import { PageHeader } from "@/components/page-header";
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
      <PageHeader breadcrumb={<DayBreadcrumb />} heading={<DayHeading />} />
      <Suspense fallback={<DayDetailBodyFallback />}>
        <DayDetailBody params={params} />
      </Suspense>
    </main>
  );
}
