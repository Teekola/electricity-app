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

import type { DaysQuery } from "@repo/api-contract";

import { toSearchParams } from "@/lib/days-query";

interface DaysNavigation {
  readonly isNavigating: boolean;
  readonly query: DaysQuery;
  readonly goTo: (query: DaysQuery) => void;
}

const NavigationContext = createContext<DaysNavigation | null>(null);

export interface DaysNavigationProviderProps {
  readonly query: DaysQuery;
  readonly children: ReactNode;
}

export function DaysNavigationProvider({ query, children }: DaysNavigationProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isNavigating, startNavigating] = useTransition();
  const [optimisticQuery, setOptimisticQuery] = useOptimistic(query);

  const navigation = useMemo<DaysNavigation>(
    () => ({
      isNavigating,
      query: optimisticQuery,
      goTo: (next) => {
        const search = toSearchParams(next).toString();

        // Asking for the list already shown, such as the page the reader is on.
        if (search === toSearchParams(optimisticQuery).toString()) return;

        startNavigating(() => {
          setOptimisticQuery(next);
          router.push(`${pathname}?${search}`);
        });
      },
    }),
    [isNavigating, optimisticQuery, pathname, router, setOptimisticQuery],
  );

  return <NavigationContext value={navigation}>{children}</NavigationContext>;
}

export function useDaysNavigation(): DaysNavigation {
  const navigation = useContext(NavigationContext);

  if (navigation === null) {
    throw new Error("useDaysNavigation used outside DaysNavigationProvider");
  }

  return navigation;
}
