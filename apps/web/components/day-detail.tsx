import { cacheLife, cacheTag } from "next/cache";
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
import { Skeleton } from "@/components/ui/skeleton";
import { rankCheapestHours } from "@/lib/cheapest-hours";
import { getDayDetail } from "@/lib/day-detail";
import {
  formatHourlyPrice,
  formatMwh,
  formatPercent,
  formatPrice,
  formatStreak,
} from "@/lib/format";
import { describeIncompleteness } from "@/lib/incomplete-day";
import { joinWithAnd } from "@/lib/list-phrase";

type DayParams = Promise<{ date: string }>;

async function readDate(params: DayParams): Promise<IsoDate> {
  const day = isoDateSchema.safeParse((await params).date);

  // A segment that is not a date never reaches a fetch.
  if (!day.success) notFound();

  return day.data;
}

export async function DayDetailBody({ params }: { readonly params: DayParams }) {
  return <DayFiguresAndCharts date={await readDate(params)} />;
}

async function DayFiguresAndCharts({ date }: { readonly date: IsoDate }) {
  "use cache";
  cacheLife("max");
  cacheTag("day-detail");

  const dayDetail = await getDayDetail(date);

  if (dayDetail === null) notFound();

  return (
    <>
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
    <div className="min-h-31.5 rounded-none border p-4 lg:min-h-27.5">
      <p className="text-sm text-muted-foreground">{label}</p>
      {children}
    </div>
  );
}

export function DayDetailBodyFallback() {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 5 }, (_, index) => (
          <Skeleton key={index} className="min-h-31.5 w-full lg:min-h-27.5" />
        ))}
        <Skeleton className="min-h-32.5 w-full" />
      </div>
      <Skeleton className="h-93.5 w-full md:h-88.5" />
      <Skeleton className="h-93.5 w-full md:h-88.5" />
    </>
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
        <p className="min-h-10 text-sm text-muted-foreground md:min-h-0">{description}</p>
      </div>
      {children}
    </section>
  );
}
