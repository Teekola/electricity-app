"use client";

import {
  createColumnHelper,
  rowSortingFeature,
  type SortingState,
  tableFeatures,
  type Updater,
  useTable,
} from "@tanstack/react-table";
import {
  ArrowDown,
  ArrowUp,
  ChevronRight,
  ChevronsUpDown,
  RotateCcw,
  TriangleAlert,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import type { DailyStatistics } from "@repo/api-contract";
import { DEFAULT_DAYS_PAGE_SIZE } from "@repo/api-contract";

import { useDaysNavigation } from "@/components/days-navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { dayHref } from "@/lib/day-detail-links";
import { hasFilters, withoutFilters } from "@/lib/days-query";
import { fromSortingState, toSortingState } from "@/lib/days-sorting";
import { formatDay, formatMwh, formatPrice, formatStreak } from "@/lib/format";
import { describeIncompleteness } from "@/lib/incomplete-day";
import { cn } from "@/lib/utils";

interface ColumnMeta {
  readonly numeric?: boolean;
  /** Sized for the widest value the dataset can hold. */
  readonly width: string;
}

const columnMeta: ColumnMeta = { width: "w-auto" };
const features = tableFeatures({ rowSortingFeature, columnMeta });
const helper = createColumnHelper<typeof features, DailyStatistics>();

const columns = helper.columns([
  helper.accessor("date", {
    id: "date",
    header: "Day",
    cell: ({ row }) => <DayCell day={row.original} />,
    meta: { width: "w-28" },
  }),
  helper.accessor("totalProductionMwh", {
    id: "prod",
    header: "Production (MWh)",
    cell: ({ row }) => formatMwh(row.original.totalProductionMwh),
    meta: { numeric: true, width: "w-36" },
  }),
  helper.accessor("totalConsumptionMwh", {
    id: "cons",
    header: "Consumption (MWh)",
    cell: ({ row }) => formatMwh(row.original.totalConsumptionMwh),
    meta: { numeric: true, width: "w-40" },
  }),
  helper.accessor("averagePriceCentsPerKwh", {
    id: "price",
    header: "Avg price (c/kWh)",
    cell: ({ row }) => formatPrice(row.original.averagePriceCentsPerKwh),
    meta: { numeric: true, width: "w-40" },
  }),
  helper.accessor("longestNegativePriceStreakHours", {
    id: "streak",
    header: "Longest negative streak",
    cell: ({ row }) => formatStreak(row.original.longestNegativePriceStreakHours),
    meta: { numeric: true, width: "w-48" },
  }),
]);

export interface DailyStatisticsTableProps {
  readonly dailyStatistics: DailyStatistics[];
}

export function DailyStatisticsTable({ dailyStatistics }: DailyStatisticsTableProps) {
  const { isNavigating, query, goTo } = useDaysNavigation();
  const sorting = toSortingState(query);

  function handleSortingChange(updater: Updater<SortingState>): void {
    goTo(fromSortingState(typeof updater === "function" ? updater(sorting) : updater, query));
  }

  const isEmpty = !isNavigating && dailyStatistics.length === 0;

  const table = useTable({
    features,
    columns,
    data: dailyStatistics,
    manualSorting: true,
    enableSortingRemoval: false,
    state: { sorting },
    onSortingChange: handleSortingChange,
  });

  return (
    <DailyStatisticsTableFrame
      busy={isNavigating}
      fill={isEmpty}
      header={table.getHeaderGroups().map((group) => (
        <TableRow key={group.id}>
          {group.headers.map((header) => (
            <HeaderCell
              key={header.id}
              label={columnLabel(header.column.columnDef)}
              numeric={header.column.columnDef.meta?.numeric}
              direction={header.column.getIsSorted()}
              onToggle={
                header.column.getCanSort() ? header.column.getToggleSortingHandler() : undefined
              }
            />
          ))}
        </TableRow>
      ))}
    >
      {isNavigating ? (
        <PlaceholderRows count={query.size} />
      ) : (
        table.getRowModel().rows.map((row) => (
          <TableRow key={row.id}>
            {row.getAllCells().map((cell) => (
              <TableCell
                key={cell.id}
                className={cell.column.columnDef.meta?.numeric ? "text-right" : undefined}
              >
                <table.FlexRender cell={cell} />
              </TableCell>
            ))}
          </TableRow>
        ))
      )}
      {isEmpty && (
        <TableRow className="hover:bg-transparent">
          <TableCell
            colSpan={columns.length}
            className="text-center align-middle text-muted-foreground"
          >
            {hasFilters(query) ? (
              <span className="inline-flex flex-col items-center gap-2">
                No days match these filters.
                <Button variant="outline" size="sm" onClick={() => goTo(withoutFilters(query))}>
                  <RotateCcw aria-hidden />
                  Reset
                </Button>
              </span>
            ) : (
              "No days to show."
            )}
          </TableCell>
        </TableRow>
      )}
    </DailyStatisticsTableFrame>
  );
}

export interface DailyStatisticsTableSkeletonProps {
  readonly size?: number;
}

export function DailyStatisticsTableSkeleton({
  size = DEFAULT_DAYS_PAGE_SIZE,
}: DailyStatisticsTableSkeletonProps) {
  return (
    <DailyStatisticsTableFrame
      busy
      header={
        <TableRow>
          {columns.map((column) => (
            <HeaderCell
              key={column.id}
              label={columnLabel(column)}
              numeric={column.meta?.numeric}
              direction={false}
            />
          ))}
        </TableRow>
      }
    >
      <PlaceholderRows count={size} />
    </DailyStatisticsTableFrame>
  );
}

function DailyStatisticsTableFrame({
  header,
  busy,
  fill,
  children,
}: {
  readonly header: ReactNode;
  readonly busy?: boolean;
  readonly fill?: boolean;
  readonly children: ReactNode;
}) {
  return (
    <Table
      className={cn("min-w-3xl table-fixed", fill && "h-full")}
      containerClassName="min-h-64 flex-1 overflow-y-auto  border pr-1 [scrollbar-gutter:stable]"
    >
      <colgroup>
        {columns.map((column) => (
          <col key={column.id} className={column.meta?.width} />
        ))}
      </colgroup>
      <TableHeader className="sticky top-0 z-10 bg-background">{header}</TableHeader>
      <TableBody className="tabular-nums" aria-busy={busy}>
        {children}
      </TableBody>
    </Table>
  );
}

function HeaderCell({
  label,
  numeric,
  direction,
  onToggle,
}: {
  readonly label: string;
  readonly numeric?: boolean;
  readonly direction: false | "asc" | "desc";
  readonly onToggle?: (event: unknown) => void;
}) {
  return (
    <TableHead className={numeric ? "text-right" : undefined} aria-sort={ariaSort(direction)}>
      <Button
        variant="ghost"
        size="sm"
        className={cn("h-8", numeric ? "-mr-2" : "-ml-2")}
        disabled={!onToggle}
        onClick={onToggle}
      >
        {label}
        <SortIcon direction={direction} />
      </Button>
    </TableHead>
  );
}

function PlaceholderRows({ count }: { readonly count: number }) {
  return Array.from({ length: count }, (_, row) => (
    <TableRow key={row}>
      {columns.map((column) => (
        <TableCell key={column.id}>
          <Skeleton className={cn("h-4", column.meta?.numeric ? "ml-auto w-16" : "w-24")} />
        </TableCell>
      ))}
    </TableRow>
  ));
}

function columnLabel({ header }: { header?: unknown }): string {
  return typeof header === "string" ? header : "";
}

function ariaSort(direction: false | "asc" | "desc") {
  if (direction === false) return undefined;

  return direction === "asc" ? "ascending" : "descending";
}

function SortIcon({ direction }: { readonly direction: false | "asc" | "desc" }) {
  if (direction === "asc") return <ArrowUp aria-hidden />;
  if (direction === "desc") return <ArrowDown aria-hidden />;

  return <ChevronsUpDown aria-hidden className="text-muted-foreground/50" />;
}

function DayCell({ day }: { readonly day: DailyStatistics }) {
  const { query } = useDaysNavigation();
  const explanation = describeIncompleteness(day);

  return (
    <span className="inline-flex items-center gap-1.5">
      <Link
        href={dayHref(day.date, query)}
        className="group inline-flex items-center gap-1 rounded-sm underline-offset-4 hover:underline focus-visible:ring-1 focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        {formatDay(day.date)}
        <ChevronRight
          aria-hidden
          className="size-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1"
        />
      </Link>
      {explanation !== null && (
        <Tooltip>
          <TooltipTrigger
            aria-label={explanation}
            className="inline-flex text-amber-600 dark:text-amber-500"
          >
            <TriangleAlert aria-hidden className="size-3.5 shrink-0" />
          </TooltipTrigger>
          <TooltipContent>{explanation}</TooltipContent>
        </Tooltip>
      )}
    </span>
  );
}
