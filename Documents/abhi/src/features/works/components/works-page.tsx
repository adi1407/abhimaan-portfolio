import { Container } from "@/components/layout/container";
import { ExperienceSplit } from "@/features/works/components/experience-split";

export function WorksPage() {
  return (
    <div className="works">
      <section className="works__intro">
        <Container>
          <p className="works__eyebrow">04 — Experience</p>
          <h1 className="works__title">
            A short history
            <span className="works__title-serif"> of the work</span>
          </h1>
          <p className="works__lede">
            Five roles, in reverse — the studios, the craft, and what each one
            taught. Scroll the timeline; the year on the left keeps your place.
          </p>
        </Container>
      </section>

      <ExperienceSplit />
    </div>
  );
}
