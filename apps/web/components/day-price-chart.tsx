"use client";

import type { BarShapeProps } from "recharts";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Rectangle,
  ReferenceDot,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";

import type { CheapestHour, DataPoint } from "@repo/api-contract";

import type { ChartConfig } from "@/components/ui/chart";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { rankCheapestHours } from "@/lib/cheapest-hours";
import { hourAxisProps, priceAxisDomain } from "@/lib/day-chart";
import { formatHourlyPrice, formatPrice } from "@/lib/format";

const PRICE_COLOR = "var(--chart-series-1)";
const NEGATIVE_PRICE_COLOR = "var(--chart-series-2)";

const config = {
  priceCentsPerKwh: { label: "Price", color: PRICE_COLOR },
} satisfies ChartConfig;

function priceFill(priceCentsPerKwh: number | null): string {
  // An hour with no price has no bar to colour.
  if (priceCentsPerKwh === null) return "transparent";

  return priceCentsPerKwh < 0 ? NEGATIVE_PRICE_COLOR : PRICE_COLOR;
}

// Recharts deprecated <Cell> in favour of shape, which reads the hour's own price off `value`.
function PriceBar({ x, y, width, height, radius, value }: BarShapeProps) {
  const price = typeof value === "number" ? value : null;

  return (
    <Rectangle x={x} y={y} width={width} height={height} radius={radius} fill={priceFill(price)} />
  );
}

export interface DayPriceChartProps {
  readonly dataPoints: readonly DataPoint[];
  readonly cheapestHours: readonly CheapestHour[];
}

export function DayPriceChart({ dataPoints, cheapestHours }: DayPriceChartProps) {
  return (
    <ChartContainer config={config} className="h-64 w-full">
      <BarChart
        accessibilityLayer
        data={[...dataPoints]}
        margin={{ left: 8, right: 8, top: 16, bottom: 8 }}
      >
        <CartesianGrid vertical={false} />
        <XAxis {...hourAxisProps} />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          width={56}
          domain={priceAxisDomain}
          tickFormatter={formatPrice}
        />
        <ReferenceLine y={0} stroke="var(--border)" />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value) => `${formatHourlyPrice(Number(value))} c/kWh`}
            />
          }
        />
        <Bar
          dataKey="priceCentsPerKwh"
          radius={2}
          isAnimationActive={false}
          fill={PRICE_COLOR}
          shape={PriceBar}
        />
        {/* Rank is a non-colour mark, so it cannot compete with the sign an hour may also carry. */}
        {rankCheapestHours(cheapestHours).map(({ hour, priceCentsPerKwh, rank }) => (
          <ReferenceDot
            key={hour}
            x={hour}
            y={priceCentsPerKwh}
            r={4}
            fill="var(--foreground)"
            stroke="var(--background)"
            strokeWidth={2}
            label={{
              value: String(rank),
              position: priceCentsPerKwh < 0 ? "bottom" : "top",
              fill: "var(--foreground)",
              fontSize: 11,
            }}
          />
        ))}
      </BarChart>
    </ChartContainer>
  );
}
