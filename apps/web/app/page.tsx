import type { Metadata } from "next";
import { Suspense } from "react";

import { DailyStatistics, DailyStatisticsFallback } from "@/components/daily-statistics";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = {
  title: "Electricity data",
  description:
    "Finnish hourly electricity production, consumption and price data, summarised per day.",
};

export default function Page({ searchParams }: PageProps<"/">) {
  return (
    <main className="mx-auto flex h-dvh min-h-152 w-full max-w-6xl flex-col gap-6 px-4 py-8 md:px-8">
      <PageHeader heading="Electricity data">
        <p className="max-w-2xl text-sm text-muted-foreground">
          Finnish hourly production, consumption and price data, summarised per day. Consumption was
          only measured from August 2023 onwards, and days the dataset does not cover in full are
          marked, because their totals are not comparable to a full day&apos;s. Click a date to open
          that day.
        </p>
      </PageHeader>
      <Suspense fallback={<DailyStatisticsFallback />}>
        <DailyStatistics searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
