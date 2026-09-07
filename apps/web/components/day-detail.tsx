import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import type {
  CheapestHour,
  DataPoint,
  DayDetail as DayDetailData,
  IsoDate,
  PeakConsumptionRatioHour,
} from "@repo/api-contract";
import { isoDateSchema } from "@repo/api-contract";

import { DayPriceChart, DayProductionChart } from "@/components/day-charts";
import { PageHeader } from "@/components/page-header";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Skeleton } from "@/components/ui/skeleton";
import { rankCheapestHours } from "@/lib/cheapest-hours";
import { getDayDetail } from "@/lib/day-detail";
import { listHref } from "@/lib/day-detail-links";
import type { SearchParams } from "@/lib/days-query";
import {
  formatDay,
  formatHourlyPrice,
  formatMwh,
  formatPercent,
  formatPrice,
  formatStreak,
} from "@/lib/format";
import { describeIncompleteness } from "@/lib/incomplete-day";
import { joinWithAnd } from "@/lib/list-phrase";

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

  // A segment that is not a date never reaches a fetch.
  if (!day.success) notFound();

  const dayDetail = await getDayDetail(day.data);

  if (dayDetail === null) notFound();

  return (
    <>
      <PageHeader
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
      <DayDetailFigures
        dailyStatistics={dayDetail.dailyStatistics}
        peakConsumptionRatioHours={dayDetail.peakConsumptionRatioHours}
        cheapestHours={dayDetail.cheapestHours}
      />
      <DayDetailCharts
        dataPoints={dayDetail.dataPoints}
        cheapestHours={dayDetail.cheapestHours}
        hasConsumption={dayDetail.dailyStatistics.totalConsumptionMwh !== null}
      />
    </>
  );
}

export function DayDetailFallback() {
  return (
    <>
      <PageHeader
        breadcrumb={<Skeleton className="h-4 w-40" />}
        heading={<Skeleton className="h-8 w-80" />}
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="h-24 w-full" />
        ))}
      </div>
      <Skeleton className="h-80 w-full" />
      <Skeleton className="h-80 w-full" />
    </>
  );
}

function DayDetailFigures({
  dailyStatistics,
  peakConsumptionRatioHours,
  cheapestHours,
}: Omit<DayDetailData, "dataPoints">) {
  const incompleteness = describeIncompleteness(dailyStatistics);

  return (
    <section className="space-y-3">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Figure
          label="Total production"
          value={formatMwh(dailyStatistics.totalProductionMwh)}
          unit="MWh"
        />
        <Figure
          label="Total consumption"
          value={formatMwh(dailyStatistics.totalConsumptionMwh)}
          unit="MWh"
          note={
            dailyStatistics.totalConsumptionMwh === null ? "Not measured on this day." : undefined
          }
        />
        <Figure
          label="Average price"
          value={formatPrice(dailyStatistics.averagePriceCentsPerKwh)}
          unit="c/kWh"
        />
        <PeakConsumptionRatioFigure hours={peakConsumptionRatioHours} />
        <Figure
          label="Longest negative price streak"
          value={formatStreak(dailyStatistics.longestNegativePriceStreakHours)}
        />
        <CheapestHoursFigure cheapestHours={cheapestHours} />
      </div>
      {incompleteness !== null && (
        <p className="text-sm text-amber-600 dark:text-amber-500">{incompleteness}.</p>
      )}
    </section>
  );
}

function PeakConsumptionRatioFigure({
  hours,
}: {
  readonly hours: readonly PeakConsumptionRatioHour[];
}) {
  const [peak] = hours;

  if (peak === undefined) {
    return (
      <Figure
        label="Peak consumption against production"
        value="—"
        note="No hour measured both consumption and production."
      />
    );
  }

  return (
    <Figure
      label="Peak consumption against production"
      value={formatPercent(peak.consumptionToProductionRatio)}
      note={
        hours.length === 1
          ? `At ${peak.hour}: ${formatMwh(peak.consumptionMwh)} MWh consumed against ${formatMwh(peak.productionMwh)} MWh produced.`
          : `Reached at ${joinWithAnd(hours.map(({ hour }) => hour))}.`
      }
    />
  );
}

function CheapestHoursFigure({
  cheapestHours,
}: {
  readonly cheapestHours: readonly CheapestHour[];
}) {
  if (cheapestHours.length === 0) {
    return <Figure label="Cheapest hours" value="—" note="No hour of this day carries a price." />;
  }

  return (
    <FigureCard label="Cheapest hours">
      <ol className="mt-2 space-y-1">
        {rankCheapestHours(cheapestHours).map(({ hour, priceCentsPerKwh, rank }) => (
          <li key={hour} className="flex items-baseline justify-between gap-3 text-sm">
            <span className="tabular-nums">
              <span className="text-muted-foreground">{rank}.</span> {hour}
            </span>
            <span className="font-medium tabular-nums">
              {formatHourlyPrice(priceCentsPerKwh)}{" "}
              <span className="text-muted-foreground">c/kWh</span>
            </span>
          </li>
        ))}
      </ol>
    </FigureCard>
  );
}

function Figure({
  label,
  value,
  unit,
  note,
}: {
  readonly label: string;
  readonly value: string;
  readonly unit?: string;
  readonly note?: string;
}) {
  return (
    <FigureCard label={label}>
      <p className="mt-1 text-2xl font-semibold tabular-nums">
        {value}
        {unit !== undefined && (
          <span className="ml-1 text-base font-normal text-muted-foreground">{unit}</span>
        )}
      </p>
      {note !== undefined && <p className="mt-1 text-xs text-muted-foreground">{note}</p>}
    </FigureCard>
  );
}

function FigureCard({ label, children }: { readonly label: string; readonly children: ReactNode }) {
  return (
    <div className="rounded-none border p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      {children}
    </div>
  );
}

function DayDetailCharts({
  dataPoints,
  cheapestHours,
  hasConsumption,
}: {
  readonly dataPoints: readonly DataPoint[];
  readonly cheapestHours: readonly CheapestHour[];
  readonly hasConsumption: boolean;
}) {
  const hasPrices = dataPoints.some(({ priceCentsPerKwh }) => priceCentsPerKwh !== null);

  return (
    <>
      <ChartSection
        title={hasConsumption ? "Production and consumption" : "Production"}
        description={
          hasConsumption
            ? "Hourly production and consumption in MWh."
            : "Hourly production in MWh. Consumption was not measured on this day."
        }
      >
        <DayProductionChart dataPoints={dataPoints} hasConsumption={hasConsumption} />
      </ChartSection>

      <ChartSection
        title="Price by hour"
        description={
          hasPrices
            ? "Hourly price in c/kWh. Hours below zero point downward. The three cheapest are numbered."
            : "No hour of this day carries a price, so there is nothing to draw."
        }
      >
        {hasPrices && <DayPriceChart dataPoints={dataPoints} cheapestHours={cheapestHours} />}
      </ChartSection>
    </>
  );
}

function ChartSection({
  title,
  description,
  children,
}: {
  readonly title: string;
  readonly description: string;
  readonly children: ReactNode;
}) {
  return (
    <section className="space-y-3 rounded-none border p-4">
      <div className="space-y-1">
        <h2 className="text-lg font-medium">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  );
}
