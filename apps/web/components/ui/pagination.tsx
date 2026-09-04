import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import type * as React from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function Pagination({ className, ...props }: React.ComponentProps<"nav">) {
  return (
    <nav
      role="navigation"
      aria-label="pagination"
      data-slot="pagination"
      className={cn("mx-auto flex w-full justify-center", className)}
      {...props}
    />
  );
}

function PaginationContent({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="pagination-content"
      className={cn("flex items-center gap-0.5", className)}
      {...props}
    />
  );
}

function PaginationItem({ ...props }: React.ComponentProps<"li">) {
  return <li data-slot="pagination-item" {...props} />;
}

/** Narrower than an anchor's props on purpose: a pager links, it does not need DOM handlers. */
type PaginationLinkProps = {
  readonly children?: React.ReactNode;
  readonly className?: string;
  /** Absent means there is no such page, so the control renders inert rather than vanishing. */
  readonly href?: string;
  readonly isActive?: boolean;
  readonly onClick?: React.MouseEventHandler<HTMLAnchorElement>;
  readonly "aria-label"?: string;
} & Pick<React.ComponentProps<typeof Button>, "size">;

function PaginationLink({
  className,
  href,
  isActive,
  size = "icon",
  onClick,
  ...props
}: PaginationLinkProps) {
  return (
    <Button
      variant={isActive ? "outline" : "ghost"}
      size={size}
      className={cn(href === undefined && "pointer-events-none opacity-50", className)}
      nativeButton={false}
      render={
        href === undefined ? (
          <span aria-disabled data-slot="pagination-link" {...props} />
        ) : (
          <Link
            href={href}
            onClick={onClick}
            aria-current={isActive ? "page" : undefined}
            data-slot="pagination-link"
            data-active={isActive}
            {...props}
          />
        )
      }
    />
  );
}

function PaginationPrevious({
  className,
  text = "Previous",
  ...props
}: PaginationLinkProps & { readonly text?: string }) {
  return (
    <PaginationLink
      aria-label="Go to previous page"
      size="default"
      className={cn("pl-1.5!", className)}
      {...props}
    >
      <ChevronLeft aria-hidden data-icon="inline-start" />
      <span className="hidden sm:block">{text}</span>
    </PaginationLink>
  );
}

function PaginationNext({
  className,
  text = "Next",
  ...props
}: PaginationLinkProps & { readonly text?: string }) {
  return (
    <PaginationLink
      aria-label="Go to next page"
      size="default"
      className={cn("pr-1.5!", className)}
      {...props}
    >
      <span className="hidden sm:block">{text}</span>
      <ChevronRight aria-hidden data-icon="inline-end" />
    </PaginationLink>
  );
}

function PaginationEllipsis({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      aria-hidden
      data-slot="pagination-ellipsis"
      className={cn(
        "flex size-8 items-center justify-center [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    >
      <MoreHorizontal />
      <span className="sr-only">More pages</span>
    </span>
  );
}

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
};
