"use client";

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import type { DataPoint } from "@repo/api-contract";

import type { ChartConfig } from "@/components/ui/chart";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { hourAxisProps } from "@/lib/day-chart";
import { formatMwh } from "@/lib/format";

const config = {
  productionMwh: { label: "Production", color: "var(--chart-series-1)" },
  consumptionMwh: { label: "Consumption", color: "var(--chart-series-2)" },
} satisfies ChartConfig;

export interface DayProductionChartProps {
  readonly dataPoints: readonly DataPoint[];
  /** Consumption is measured over part of the dataset only, so the second series is optional. */
  readonly hasConsumption: boolean;
}

export function DayProductionChart({ dataPoints, hasConsumption }: DayProductionChartProps) {
  return (
    <ChartContainer config={config} className="h-64 w-full">
      <LineChart accessibilityLayer data={[...dataPoints]} margin={{ left: 8, right: 8, top: 8 }}>
        <CartesianGrid vertical={false} />
        <XAxis {...hourAxisProps} />
        {/* One axis for both series: a second scale would invent a comparison the data lacks. */}
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          width={64}
          tickFormatter={formatMwh}
        />
        <ChartTooltip
          content={<ChartTooltipContent formatter={(value) => `${formatMwh(Number(value))} MWh`} />}
        />
        {hasConsumption && <ChartLegend content={<ChartLegendContent />} />}
        <Line
          dataKey="productionMwh"
          type="monotone"
          stroke="var(--color-productionMwh)"
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
        {hasConsumption && (
          <Line
            dataKey="consumptionMwh"
            type="monotone"
            stroke="var(--color-consumptionMwh)"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        )}
      </LineChart>
    </ChartContainer>
  );
}
