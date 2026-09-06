"use client";

import { CalendarDays, RotateCcw, SlidersHorizontal, X } from "lucide-react";
import { type SyntheticEvent, useState } from "react";
import type { DateRange } from "react-day-picker";

import type { DailyStatisticsMeasure, DaysQuery, IsoDate } from "@repo/api-contract";
import { DAILY_STATISTICS_MEASURES, DAYS_MEASURE_BOUNDS } from "@repo/api-contract";

import { useDaysNavigation } from "@/components/days-navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { fromIsoDate, toIsoDate } from "@/lib/day";
import {
  describeDateRange,
  describeMeasureFilter,
  measureMaxDecimals,
  measureName,
  measureUnit,
} from "@/lib/days-filters";
import {
  collectRanges,
  filteredMeasures,
  hasFilters,
  type MeasureBound,
  type MeasureRanges,
  measureRanges,
  withDateRange,
  withMeasureRanges,
  withoutFilters,
  withoutMeasure,
} from "@/lib/days-query";
import { sanitizeDecimalInput } from "@/lib/decimal-input";

export interface DaysFiltersProps {
  /** Any Day the dataset holds, which is where the calendar opens when no range is set. */
  readonly knownDay?: IsoDate;
}

export function DaysFilters({ knownDay }: DaysFiltersProps) {
  const { query, goTo } = useDaysNavigation();
  const measures = filteredMeasures(query);

  return (
    <div className="flex min-h-9 shrink-0 flex-wrap items-center gap-2">
      <DateRangeFilter knownDay={knownDay} />
      <MeasureFilters />
      {measures.map((measure) => (
        <Badge key={measure} variant="outline" className="h-8 gap-1.5 pr-1">
          {describeMeasureFilter(query, measure)}
          <button
            type="button"
            aria-label={`Clear ${measureName(measure).toLowerCase()} filter`}
            className="inline-flex size-4 items-center justify-center text-muted-foreground hover:text-foreground"
            onClick={() => goTo(withoutMeasure(query, measure))}
          >
            <X aria-hidden className="size-3" />
          </button>
        </Badge>
      ))}
      {hasFilters(query) && (
        <Button variant="ghost" size="sm" onClick={() => goTo(withoutFilters(query))}>
          <RotateCcw aria-hidden />
          Reset
        </Button>
      )}
    </div>
  );
}

function DateRangeFilter({ knownDay }: DaysFiltersProps) {
  const { query, goTo } = useDaysNavigation();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DateRange | undefined>(undefined);
  const anchor = useRememberedDay(knownDay);

  function commit(range: DateRange | undefined): void {
    setDraft(undefined);
    goTo(
      withDateRange(
        query,
        range?.from === undefined ? undefined : toIsoDate(range.from),
        range?.to === undefined ? undefined : toIsoDate(range.to),
      ),
    );
  }

  function handleOpenChange(next: boolean): void {
    setOpen(next);

    // A lone first Day reads as "from that Day onwards", so closing commits rather than drops it.
    if (!next && draft !== undefined) commit(draft);
  }

  const selected = draft ?? toDateRange(query);

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        render={
          <Button variant="outline" size="sm" className="font-normal">
            <CalendarDays aria-hidden />
            {describeDateRange(query)}
          </Button>
        }
      />
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          autoFocus
          mode="range"
          numberOfMonths={2}
          weekStartsOn={1}
          captionLayout="dropdown"
          // The dataset is a fixed historical snapshot, so today's month is years past its end.
          defaultMonth={selected?.from ?? monthBefore(anchor)}
          selected={selected}
          onSelect={(range) => {
            setDraft(range);

            // Stays open, so the range can be adjusted against the rows it just produced.
            if (range?.from !== undefined && range.to !== undefined) commit(range);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

function useRememberedDay(knownDay: IsoDate | undefined): IsoDate | undefined {
  const [remembered, setRemembered] = useState(knownDay);

  if (knownDay !== undefined && knownDay !== remembered) setRemembered(knownDay);

  // A page matching nothing carries no Day, which is exactly when the reader opens the calendar.
  return knownDay ?? remembered;
}

function monthBefore(day: IsoDate | undefined): Date | undefined {
  if (day === undefined) return undefined;

  const date = fromIsoDate(day);

  // Opening a month early puts the Day in the second of the two months, not past the last one.
  return new Date(date.getFullYear(), date.getMonth() - 1, 1);
}

function toDateRange({ dateFrom, dateTo }: DaysQuery): DateRange | undefined {
  if (dateFrom === undefined && dateTo === undefined) return undefined;

  return {
    from: dateFrom === undefined ? undefined : fromIsoDate(dateFrom),
    to: dateTo === undefined ? undefined : fromIsoDate(dateTo),
  };
}

function MeasureFilters() {
  const { query, goTo } = useDaysNavigation();
  const [open, setOpen] = useState(false);
  const active = filteredMeasures(query).length;
  const ranges = measureRanges(query);

  function handleSubmit(event: SyntheticEvent<HTMLFormElement, SubmitEvent>): void {
    event.preventDefault();
    const bounds = new FormData(event.currentTarget);

    setOpen(false);
    goTo(withMeasureRanges(query, readRanges(bounds)));
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button variant="outline" size="sm" className="font-normal">
            <SlidersHorizontal aria-hidden />
            Filters
            {active > 0 && (
              <Badge variant="secondary" className="h-4 px-1">
                {active}
              </Badge>
            )}
          </Button>
        }
      />
      <SheetContent side="right" className="gap-0">
        <SheetHeader>
          <SheetTitle>Filters</SheetTitle>
          <SheetDescription>
            Leave a field empty to leave that end of the range open.
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex flex-col gap-4 overflow-y-auto px-4 py-2">
            {DAILY_STATISTICS_MEASURES.map((measure) => (
              <MeasureRange key={measure} measure={measure} ranges={ranges} />
            ))}
          </div>
          <SheetFooter className="flex-row justify-end gap-2">
            <Button type="submit" size="sm">
              Apply
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function MeasureRange({
  measure,
  ranges,
}: {
  readonly measure: DailyStatisticsMeasure;
  readonly ranges: MeasureRanges;
}) {
  const [minimum, maximum] = DAYS_MEASURE_BOUNDS[measure];

  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="text-xs font-medium">
        {measureName(measure)} ({measureUnit(measure)})
      </legend>
      <div className="flex items-center gap-2">
        <DecimalField label="Min" bound={minimum} initial={ranges[minimum]} measure={measure} />
        <DecimalField label="Max" bound={maximum} initial={ranges[maximum]} measure={measure} />
      </div>
    </fieldset>
  );
}

function DecimalField({
  label,
  bound,
  initial,
  measure,
}: {
  readonly label: string;
  readonly bound: MeasureBound;
  readonly initial: number | undefined;
  readonly measure: DailyStatisticsMeasure;
}) {
  const [value, setValue] = useState(initial === undefined ? "" : String(initial));

  return (
    <div className="flex-1 space-y-1">
      <Label htmlFor={bound} className="text-muted-foreground">
        {label}
      </Label>
      <Input
        id={bound}
        name={bound}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        // Controlled, so what the reader typed can be rewritten into a number as they type.
        value={value}
        onChange={(event) =>
          setValue(sanitizeDecimalInput(event.target.value, measureMaxDecimals(measure)))
        }
      />
    </div>
  );
}

function readRanges(bounds: FormData): MeasureRanges {
  return collectRanges((bound) => {
    const value = bounds.get(bound);

    if (typeof value !== "string" || value.trim() === "") return undefined;

    const typed = Number(value);

    return Number.isFinite(typed) ? typed : undefined;
  });
}
