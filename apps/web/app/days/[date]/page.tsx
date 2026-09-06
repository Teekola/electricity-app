import type { Metadata } from "next";
import { Suspense } from "react";

import { isoDateSchema } from "@repo/api-contract";

import { DayDetail, DayDetailFallback, dayDetailTitle } from "@/components/day-detail";

export async function generateMetadata({ params }: PageProps<"/days/[date]">): Promise<Metadata> {
  const day = isoDateSchema.safeParse((await params).date);

  return { title: day.success ? dayDetailTitle(day.data) : "Electricity data" };
}

export default function Page({ params, searchParams }: PageProps<"/days/[date]">) {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 md:px-8">
      <Suspense fallback={<DayDetailFallback />}>
        <DayDetail params={params} searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
