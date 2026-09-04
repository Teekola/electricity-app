"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  type ReactNode,
  useContext,
  useMemo,
  useOptimistic,
  useTransition,
} from "react";

import type { DailyStatisticsQuery } from "@repo/api-contract";

import { toSearchParams } from "@/lib/daily-statistics-query";

interface DailyStatisticsNavigation {
  readonly isNavigating: boolean;
  readonly query: DailyStatisticsQuery;
  readonly goTo: (query: DailyStatisticsQuery) => void;
}

const NavigationContext = createContext<DailyStatisticsNavigation | null>(null);

export interface DailyStatisticsNavigationProviderProps {
  readonly query: DailyStatisticsQuery;
  readonly children: ReactNode;
}

export function DailyStatisticsNavigationProvider({
  query,
  children,
}: DailyStatisticsNavigationProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isNavigating, startNavigating] = useTransition();
  const [optimisticQuery, setOptimisticQuery] = useOptimistic(query);

  const navigation = useMemo<DailyStatisticsNavigation>(
    () => ({
      isNavigating,
      query: optimisticQuery,
      goTo: (next) => {
        startNavigating(() => {
          setOptimisticQuery(next);
          router.push(`${pathname}?${toSearchParams(next).toString()}`);
        });
      },
    }),
    [isNavigating, optimisticQuery, pathname, router, setOptimisticQuery],
  );

  return <NavigationContext value={navigation}>{children}</NavigationContext>;
}

export function useDailyStatisticsNavigation(): DailyStatisticsNavigation {
  const navigation = useContext(NavigationContext);

  if (navigation === null) {
    throw new Error("useDailyStatisticsNavigation used outside DailyStatisticsNavigationProvider");
  }

  return navigation;
}
