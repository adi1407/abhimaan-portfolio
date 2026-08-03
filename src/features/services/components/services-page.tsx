import { Container } from "@/components/layout/container";

export function ServicesPage() {
  return (
    <section className="flex min-h-[100svh] flex-1 items-center py-28 md:py-32">
      <Container>
        <p className="font-instrument-serif text-sm italic text-muted-foreground">
          04 — Services
        </p>
        <h1 className="mt-4 max-w-3xl font-space-grotesk text-5xl leading-[1.05] tracking-tight text-foreground md:text-6xl">
          Capabilities
        </h1>
        <p className="mt-6 max-w-xl font-dm-sans text-lg leading-relaxed text-muted-foreground">
          Identity, digital, art direction — coming soon.
        </p>
      </Container>
    </section>
  );
}
