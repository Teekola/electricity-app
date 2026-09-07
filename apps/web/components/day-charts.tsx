"use client";

import dynamic from "next/dynamic";

import { Skeleton } from "@/components/ui/skeleton";

function ChartSkeleton() {
  return <Skeleton className="h-64 w-full" />;
}

/**
 * Recharts cannot draw until it has measured its container, so a server-rendered chart is an
 * empty box until hydration. Loading the charts on the client puts a skeleton of their own height
 * in that gap, and keeps Recharts out of the server bundle.
 */
export const DayProductionChart = dynamic(
  () => import("./day-production-chart").then((module) => module.DayProductionChart),
  { ssr: false, loading: ChartSkeleton },
);

export const DayPriceChart = dynamic(
  () => import("./day-price-chart").then((module) => module.DayPriceChart),
  { ssr: false, loading: ChartSkeleton },
);
