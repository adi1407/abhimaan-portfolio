"use client";

import { useEffect } from "react";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex flex-1 items-center py-24">
      <Container className="text-center">
        <p className="font-syne text-sm uppercase tracking-[0.2em] text-muted-foreground">
          Error
        </p>
        <h1 className="mt-3 font-cormorant text-4xl text-foreground md:text-5xl">
          Something went wrong
        </h1>
        <p className="mx-auto mt-4 max-w-md font-dm-sans text-muted-foreground">
          {error.message || "An unexpected error occurred."}
        </p>
        <Button className="mt-8" onClick={reset}>
          Try again
        </Button>
      </Container>
    </main>
  );
}
