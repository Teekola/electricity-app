"use client";

import { DAILY_STATISTICS_PAGE_SIZES } from "@repo/api-contract";

import { useDailyStatisticsNavigation } from "@/components/daily-statistics-navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { withPageSize } from "@/lib/daily-statistics-query";

/** A size the URL asked for but the control does not offer still shows, rather than reading wrong. */
export function DailyStatisticsPageSize() {
  const { query, goTo } = useDailyStatisticsNavigation();

  return (
    <div className="flex shrink-0 items-center gap-2 text-sm">
      <span className="hidden text-muted-foreground md:inline">Days per page</span>
      <Select
        value={query.pageSize}
        onValueChange={(next) => {
          if (next === null) return;
          goTo(withPageSize(query, next));
        }}
      >
        <SelectTrigger aria-label="Days per page" className="w-16">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {DAILY_STATISTICS_PAGE_SIZES.map((size) => (
            <SelectItem key={size} value={size}>
              {size}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
