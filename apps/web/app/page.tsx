import type { Metadata } from "next";
import { Suspense } from "react";

import { DailyStatistics, DailyStatisticsFallback } from "@/components/daily-statistics";

export const metadata: Metadata = {
  title: "Electricity data",
  description:
    "Finnish hourly electricity production, consumption and price data, summarised per day.",
};

/** `h-dvh` with a `min-h` floor: below that height the page scrolls instead of squashing. */
export default function Page({ searchParams }: PageProps<"/">) {
  return (
    <main className="mx-auto flex h-dvh min-h-152 w-full max-w-6xl flex-col gap-6 px-4 py-8 md:px-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">Electricity data</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Finnish hourly production, consumption and price data, summarised per day. Consumption was
          only measured from August 2023 onwards, and days the dataset does not cover in full are
          marked, because their totals are not comparable to a full day&apos;s.
        </p>
      </header>
      <Suspense fallback={<DailyStatisticsFallback />}>
        <DailyStatistics searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
