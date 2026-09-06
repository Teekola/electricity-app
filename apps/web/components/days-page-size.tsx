"use client";

import { useId } from "react";

import { DAYS_PAGE_SIZES } from "@repo/api-contract";

import { useDaysNavigation } from "@/components/days-navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { withPageSize } from "@/lib/days-query";

export function DaysPageSize() {
  const { query, goTo } = useDaysNavigation();
  const labelId = useId();

  return (
    <div className="flex shrink-0 items-center gap-2 text-sm">
      <span id={labelId} className="hidden text-muted-foreground md:inline">
        Days per page
      </span>
      <Select
        value={query.size}
        onValueChange={(next) => {
          if (next === null) return;
          goTo(withPageSize(query, next));
        }}
      >
        <SelectTrigger aria-labelledby={labelId} className="w-16">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {DAYS_PAGE_SIZES.map((size) => (
            <SelectItem key={size} value={size}>
              {size}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
