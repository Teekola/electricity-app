"use client";

import { Button } from "@/components/ui/button";

interface ErrorPageProps {
  unstable_retry: () => void;
}

export default function ErrorPage({ unstable_retry }: ErrorPageProps) {
  return (
    <main className="mx-auto flex w-full max-w-lg flex-col items-start gap-4 px-4 py-24">
      <h1 className="text-2xl font-semibold tracking-tight">Electricity data is unavailable</h1>
      <p className="text-muted-foreground">
        The service that serves the measurements did not answer. Nothing is lost. The data is
        historical and unchanged.
      </p>
      <Button
        onClick={() => {
          unstable_retry();
        }}
      >
        Try again
      </Button>
    </main>
  );
}
