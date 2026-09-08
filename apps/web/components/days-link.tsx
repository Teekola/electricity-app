"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { BreadcrumbLink } from "@/components/ui/breadcrumb";
import { listHref } from "@/lib/day-detail-links";
import { readUrlSearchParams } from "@/lib/days-query";

const LABEL = "Days";

export function DaysLink() {
  const search = readUrlSearchParams(useSearchParams());

  return <BreadcrumbLink render={<Link href={listHref(search)} />}>{LABEL}</BreadcrumbLink>;
}

export function DaysLinkFallback() {
  return (
    <BreadcrumbLink
      render={<span role="link" aria-disabled="true" />}
      className="pointer-events-none animate-pulse"
    >
      {LABEL}
    </BreadcrumbLink>
  );
}
