import { ChevronLeft } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col items-start gap-6 px-4 py-8 md:px-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">Page not found</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          This address is not part of the dataset. A Day is addressed by its calendar date, as in
          /days/2024-01-15.
        </p>
      </header>
      <Link href="/" className={buttonVariants({ variant: "outline", size: "sm" })}>
        <ChevronLeft aria-hidden />
        All days
      </Link>
    </main>
  );
}
