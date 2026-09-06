import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import type { IsoDate } from "@repo/api-contract";
import { isoDateSchema } from "@repo/api-contract";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Skeleton } from "@/components/ui/skeleton";
import type { SearchParams } from "@/lib/daily-statistics-query";
import { listHref } from "@/lib/day-detail-links";
import { formatDay } from "@/lib/format";

/** Names the Day Detail once, so the tab and the heading cannot drift apart. */
export function dayDetailTitle(date: IsoDate): string {
  return `Electricity data on ${formatDay(date)}`;
}

export interface DayDetailProps {
  readonly params: Promise<{ date: string }>;
  readonly searchParams: Promise<SearchParams>;
}

export async function DayDetail({ params, searchParams }: DayDetailProps) {
  const [{ date }, search] = await Promise.all([params, searchParams]);
  const day = isoDateSchema.safeParse(date);

  // Whether the dataset covers this Day is the fetch's answer to give; a segment that is not a
  // date at all never reaches a fetch.
  if (!day.success) notFound();

  return (
    <DayDetailLayout
      breadcrumb={
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link href={listHref(search)} />}>All days</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{formatDay(day.data)}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      }
      heading={dayDetailTitle(day.data)}
    />
  );
}

export function DayDetailFallback() {
  return (
    <DayDetailLayout
      breadcrumb={<Skeleton className="h-4 w-40" />}
      heading={<Skeleton className="h-8 w-80" />}
    />
  );
}

function DayDetailLayout({
  breadcrumb,
  heading,
}: {
  readonly breadcrumb: ReactNode;
  readonly heading: ReactNode;
}) {
  return (
    <header className="space-y-2">
      {/* Holds the breadcrumb's height, so the heading does not shift up before the Day lands. */}
      <div className="flex min-h-4 items-center">{breadcrumb}</div>
      <h1 className="flex min-h-8 items-center text-3xl font-semibold">{heading}</h1>
    </header>
  );
}
