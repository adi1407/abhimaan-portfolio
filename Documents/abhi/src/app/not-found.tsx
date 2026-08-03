import Link from "next/link";
import { Container } from "@/components/layout/container";

export default function NotFound() {
  return (
    <main className="flex flex-1 items-center py-28">
      <Container className="text-center">
        <p className="font-archivo-black text-6xl font-black tracking-tight text-foreground md:text-8xl">
          404
        </p>
        <h1 className="mt-4 font-space-grotesk text-2xl font-semibold text-foreground">
          Page not found
        </h1>
        <p className="mt-3 font-manrope text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or was moved.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex h-11 items-center justify-center bg-primary px-5 font-satoshi text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Back home
        </Link>
      </Container>
    </main>
  );
}
