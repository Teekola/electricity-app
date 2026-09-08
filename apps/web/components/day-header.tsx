"use client";

import { useParams } from "next/navigation";
import { Suspense } from "react";

import type { IsoDate } from "@repo/api-contract";
import { isoDateSchema } from "@repo/api-contract";

import { DaysLink, DaysLinkFallback } from "@/components/days-link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDay, formatDayDetailTitle } from "@/lib/format";

function useDate(): IsoDate | null {
  const day = isoDateSchema.safeParse(useParams<{ date: string }>().date);

  return day.success ? day.data : null;
}

export function DayHeading() {
  return (
    <Suspense fallback={<Skeleton className="h-9 w-80" />}>
      <DayTitle />
    </Suspense>
  );
}

export function DayBreadcrumb() {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <Suspense fallback={<DaysLinkFallback />}>
            <DaysLink />
          </Suspense>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <Suspense fallback={<Skeleton className="h-3 w-24" />}>
            <DayCrumb />
          </Suspense>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

function DayTitle() {
  const date = useDate();

  return date === null ? null : formatDayDetailTitle(date);
}

function DayCrumb() {
  const date = useDate();

  return date === null ? null : <BreadcrumbPage>{formatDay(date)}</BreadcrumbPage>;
}
