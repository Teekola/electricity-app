import type { ReactNode } from "react";

import { ThemeToggle } from "@/components/theme-toggle";

export interface PageHeaderProps {
  readonly breadcrumb?: ReactNode;
  readonly heading: ReactNode;
  readonly children?: ReactNode;
}

export function PageHeader({ breadcrumb, heading, children }: PageHeaderProps) {
  return (
    <header className="space-y-2">
      {breadcrumb === undefined ? null : (
        <div className="flex min-h-4 items-center">{breadcrumb}</div>
      )}
      <div className="flex items-start justify-between gap-4">
        <h1 className="flex min-h-8 items-center text-3xl font-semibold">{heading}</h1>
        <ThemeToggle />
      </div>
      {children}
    </header>
  );
}
