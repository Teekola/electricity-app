"use client";

import {
  createColumnHelper,
  rowSortingFeature,
  type SortingState,
  tableFeatures,
  type Updater,
  useTable,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ChevronsUpDown, TriangleAlert } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useOptimistic, useTransition } from "react";

import type { DailyStatistics, DailyStatisticsQuery } from "@repo/api-contract";

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
import { fromSortingState, toSearchParams, toSortingState } from "@/lib/daily-statistics-query";
import { formatDay, formatMwh, formatPrice, formatStreak } from "@/lib/format";
import { describeIncompleteness } from "@/lib/incomplete-day";

interface ColumnMeta {
  readonly numeric?: boolean;
  readonly width: string;
}

const columnMeta: ColumnMeta = { width: "w-auto" };
const features = tableFeatures({ rowSortingFeature, columnMeta });
const helper = createColumnHelper<typeof features, DailyStatistics>();

/** Every id is a name from the contract's sort allowlist, which is what the URL carries. */
const columns = helper.columns([
  helper.accessor("date", {
    id: "date",
    header: "Day",
    cell: ({ row }) => <DayCell day={row.original} />,
    meta: { width: "w-36" },
  }),
  helper.accessor("totalProductionMwh", {
    id: "totalProductionMwh",
    header: "Production (MWh)",
    cell: ({ row }) => formatMwh(row.original.totalProductionMwh),
    meta: { numeric: true, width: "w-40" },
  }),
  helper.accessor("totalConsumptionMwh", {
    id: "totalConsumptionMwh",
    header: "Consumption (MWh)",
    cell: ({ row }) => formatMwh(row.original.totalConsumptionMwh),
    meta: { numeric: true, width: "w-44" },
  }),
  helper.accessor("averagePriceCentsPerKwh", {
    id: "averagePriceCentsPerKwh",
    header: "Avg price (c/kWh)",
    cell: ({ row }) => formatPrice(row.original.averagePriceCentsPerKwh),
    meta: { numeric: true, width: "w-40" },
  }),
  helper.accessor("longestNegativePriceStreakHours", {
    id: "longestNegativePriceStreakHours",
    header: "Longest negative streak",
    cell: ({ row }) => formatStreak(row.original.longestNegativePriceStreakHours),
    meta: { numeric: true, width: "w-52" },
  }),
]);

export interface DailyStatisticsTableProps {
  readonly dailyStatistics: DailyStatistics[];
  /** The query these rows answer. The table reads its ordering from it and writes it back. */
  readonly query: DailyStatisticsQuery;
}

/** One row per Day. Sorting a header navigates; the server does the sorting. */
export function DailyStatisticsTable({ dailyStatistics, query }: DailyStatisticsTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isSorting, startSorting] = useTransition();
  const [optimisticSorting, setOptimisticSorting] = useOptimistic(toSortingState(query));

  function handleSortingChange(updater: Updater<SortingState>): void {
    const next = typeof updater === "function" ? updater(optimisticSorting) : updater;
    const params = toSearchParams(fromSortingState(next, query));

    // A transition, so the navigation reports as pending while the old rows still show.
    startSorting(() => {
      setOptimisticSorting(next);
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  const table = useTable({
    features,
    columns,
    data: dailyStatistics,
    manualSorting: true,
    enableSortingRemoval: false,
    state: { sorting: optimisticSorting },
    onSortingChange: handleSortingChange,
  });

  return (
    <DailyStatisticsTableFrame
      busy={isSorting}
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
      {isSorting ? (
        <PlaceholderRows count={dailyStatistics.length || PLACEHOLDER_ROWS} />
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
      {!isSorting && dailyStatistics.length === 0 && (
        <TableRow>
          <TableCell colSpan={columns.length} className="py-12 text-center text-muted-foreground">
            No days match this filter.
          </TableCell>
        </TableRow>
      )}
    </DailyStatisticsTableFrame>
  );
}

export function DailyStatisticsTableSkeleton() {
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
      <PlaceholderRows count={PLACEHOLDER_ROWS} />
    </DailyStatisticsTableFrame>
  );
}

function DailyStatisticsTableFrame({
  header,
  busy,
  children,
}: {
  readonly header: ReactNode;
  readonly busy?: boolean;
  readonly children: ReactNode;
}) {
  return (
    <Table
      className="min-w-212 table-fixed"
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
        className={`h-8 ${numeric ? "-mr-2" : "-ml-2"}`}
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
          <Skeleton className={`h-4 w-16 ${column.meta?.numeric ? "ml-auto" : ""}`} />
        </TableCell>
      ))}
    </TableRow>
  ));
}

/** Every header in this table is a plain string; the type allows a render function too. */
function columnLabel({ header }: { header?: unknown }): string {
  return typeof header === "string" ? header : "";
}

const PLACEHOLDER_ROWS = 50;

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
  const explanation = describeIncompleteness(day);

  return (
    <span className="inline-flex items-center gap-1.5">
      {formatDay(day.date)}
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
